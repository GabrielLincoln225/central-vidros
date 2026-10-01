import React, { useRef, useEffect, useLayoutEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { HERO_SLIDES } from '../config/heroSlides';
import { HeroCallout } from './HeroCallout';
import { StatusFuncionamento } from './StatusFuncionamento';
import { waLink } from '../config/site';
import { trackHeroSlide, trackOrcamento, HeroSlideOrigem } from '../utils/analytics';
import { scrollToTarget } from '../utils/scroll';
import { IconChevronLeft, IconChevronRight, IconArrowRight } from './Icons';

interface HeroProps {
  onPinLeave?: (hasLeft: boolean) => void;
}

const SLIDE_COUNT = HERO_SLIDES.length;
const AUTO_ADVANCE_MS = 7000;
const FADE_MS = 250;

// useLayoutEffect warns during SSR prerender; fall back to useEffect on the server
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

interface ClipStep {
  file: string;
  rate: number;
}

// Which transition clips connect two poses (null = fade to black and jump)
function planClips(from: number, to: number): ClipStep[] | null {
  if (to === from + 1) return [{ file: `clip${to}.mp4`, rate: 6 }];
  if (to === from - 1) return [{ file: `clip${from}_rev.mp4`, rate: 6 }];
  if (to === from + 2) {
    return [
      { file: `clip${from + 1}.mp4`, rate: 9 },
      { file: `clip${to}.mp4`, rate: 9 },
    ];
  }
  if (to === from - 2) {
    return [
      { file: `clip${from}_rev.mp4`, rate: 9 },
      { file: `clip${from - 1}_rev.mp4`, rate: 9 },
    ];
  }
  return null;
}

// Load a source into a <video> and resolve once frames are actually playing
function loadAndPlay(video: HTMLVideoElement, src: string, loop: boolean, rate: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (err?: Error) => {
      if (settled) return;
      settled = true;
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      window.clearTimeout(timer);
      if (err) reject(err);
      else resolve();
    };
    const onPlaying = () => finish();
    const onError = () => finish(new Error(`video error: ${src}`));
    const timer = window.setTimeout(() => finish(new Error(`video timeout: ${src}`)), 5000);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('error', onError);
    video.muted = true;
    video.loop = loop;

    const absolute = new URL(src, window.location.href).href;
    if (video.src !== absolute) {
      video.src = src;
    } else {
      video.currentTime = 0;
    }
    // load() resets playbackRate to defaultPlaybackRate, so set both
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;

    const p = video.play();
    if (p) p.catch((e) => finish(e instanceof Error ? e : new Error(String(e))));
  });
}

// Resolve when a non-looping clip ends; a watchdog guarantees we never hang
function waitForEnd(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    if (video.ended) {
      resolve();
      return;
    }
    const expected =
      Number.isFinite(video.duration) && video.duration > 0
        ? ((video.duration - video.currentTime) / (video.playbackRate || 1)) * 1000
        : 6000;
    const onEnded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error('video error while playing'));
    };
    const timer = window.setTimeout(() => {
      cleanup();
      resolve();
    }, expected + 1500);
    const cleanup = () => {
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      window.clearTimeout(timer);
    };
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
  });
}

export const Hero: React.FC<HeroProps> = ({ onPinLeave }) => {
  const containerRef = useRef<HTMLElement>(null);
  const textColRef = useRef<HTMLDivElement>(null);
  const titleCharsRef = useRef<HTMLSpanElement[]>([]);
  const benefitsRef = useRef<HTMLUListElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const mobileChipsRef = useRef<HTMLDivElement>(null);

  // Two stacked <video> slots, ping-ponged so swaps never show a blank frame
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);
  const videoSlots = [videoARef, videoBRef];

  // Render state
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [prevPosterIndex, setPrevPosterIndex] = useState<number | null>(null);
  const [displayedSlideIndex, setDisplayedSlideIndex] = useState<number>(0);
  const [enterKey, setEnterKey] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [visibleSlot, setVisibleSlot] = useState<number>(-1);
  const [videoDisabled, setVideoDisabled] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [blackFade, setBlackFade] = useState<boolean>(false);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [autoProgress, setAutoProgress] = useState<number>(0);

  // Mutable refs read by async code (avoid stale closures)
  const currentSlideRef = useRef<number>(0);
  const busyRef = useRef<boolean>(false);
  const pendingTargetRef = useRef<number | null>(null);
  const inFlightTargetRef = useRef<number | null>(null);
  const visibleSlotRef = useRef<number>(-1);
  const isMobileRef = useRef<boolean>(false);
  const videoOffRef = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const isHeroInViewRef = useRef<boolean>(true);
  const autoElapsedRef = useRef<number>(0);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const initStartedRef = useRef<boolean>(false);
  const textTargetRef = useRef<number>(0);
  const textTimerRef = useRef<number | null>(null);
  const goToSlideRef = useRef<(target: number, origem: HeroSlideOrigem) => void>(() => {});

  const mediaPath = (filename: string) => `/hero/${isMobileRef.current ? 'mobile' : 'desktop'}/${filename}`;
  const posterPath = (index: number) => `/hero/poster/pose${index}${isMobile ? '-mobile' : ''}.webp`;

  const disableVideo = useCallback(() => {
    videoOffRef.current = true;
    setVideoDisabled(true);
  }, []);

  // ---------------------------------------------------------------------------
  // Environment detection
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    if (motionQuery.matches) videoOffRef.current = true;
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
      if (e.matches) videoOffRef.current = true;
    };
    motionQuery.addEventListener('change', handleMotionChange);

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      isMobileRef.current = mobile;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Viewport intersection: informs Header / MobileStickyBar and pauses timer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isHeroInViewRef.current = entry.isIntersecting;
        onPinLeave?.(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onPinLeave]);

  // ---------------------------------------------------------------------------
  // Video engine
  // ---------------------------------------------------------------------------
  const showSlot = (slot: number) => {
    visibleSlotRef.current = slot;
    setVisibleSlot(slot);
  };

  // Play a source in the hidden slot, then swap it into view
  const playInHiddenSlot = async (src: string, loop: boolean, rate: number) => {
    const hidden = visibleSlotRef.current === 0 ? 1 : 0;
    const next = videoSlots[hidden].current;
    if (!next) throw new Error('video element missing');
    await loadAndPlay(next, src, loop, rate);
    const prev = visibleSlotRef.current >= 0 ? videoSlots[visibleSlotRef.current].current : null;
    showSlot(hidden);
    if (prev) window.setTimeout(() => prev.pause(), 160);
    return next;
  };

  const fadeJumpToIdle = async (pose: number) => {
    setBlackFade(true);
    await sleep(FADE_MS);
    try {
      await playInHiddenSlot(mediaPath(`idle${pose}.mp4`), true, 1);
    } finally {
      setBlackFade(false);
    }
  };

  // Initial idle video, once we know which folder (mobile/desktop) to use
  useEffect(() => {
    if (initStartedRef.current || isReducedMotion) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    initStartedRef.current = true;

    const v = videoARef.current;
    if (!v) return;
    loadAndPlay(v, mediaPath('idle0.mp4'), true, 1)
      .then(() => showSlot(0))
      .catch(() => disableVideo());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReducedMotion, disableVideo]);

  // If the viewport crosses the mobile breakpoint, reload the idle for the new size
  useEffect(() => {
    if (!initStartedRef.current || videoOffRef.current || busyRef.current) return;
    if (visibleSlotRef.current < 0) return;
    playInHiddenSlot(mediaPath(`idle${currentSlideRef.current}.mp4`), true, 1).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // ---------------------------------------------------------------------------
  // Auto-advance (stops for good once the user navigates)
  // ---------------------------------------------------------------------------
  const markInteraction = useCallback(() => {
    if (userInteractedRef.current) return;
    userInteractedRef.current = true;
    setUserInteracted(true);
    setAutoProgress(0);
  }, []);

  useEffect(() => {
    if (isReducedMotion || userInteracted) return;
    const TICK = 100;
    const id = window.setInterval(() => {
      if (
        busyRef.current ||
        document.hidden ||
        !isHeroInViewRef.current ||
        userInteractedRef.current
      ) {
        return;
      }
      autoElapsedRef.current += TICK;
      setAutoProgress(Math.min(100, (autoElapsedRef.current / AUTO_ADVANCE_MS) * 100));
      if (autoElapsedRef.current >= AUTO_ADVANCE_MS) {
        autoElapsedRef.current = 0;
        goToSlideRef.current((currentSlideRef.current + 1) % SLIDE_COUNT, 'auto');
      }
    }, TICK);
    return () => window.clearInterval(id);
  }, [isReducedMotion, userInteracted]);

  // ---------------------------------------------------------------------------
  // Text animations
  // ---------------------------------------------------------------------------
  const animateTextExit = () => {
    if (!textColRef.current) return;
    gsap.to(textColRef.current, { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in', overwrite: 'auto' });
  };

  // Runs after React has rendered the new slide's text, so refs point at the new nodes
  useIsoLayoutEffect(() => {
    if (enterKey === 0 || !textColRef.current) return;
    const col = textColRef.current;
    gsap.killTweensOf(col);
    gsap.set(col, { opacity: 1, y: 0 });
    if (isReducedMotion) return;

    const tl = gsap.timeline();
    const chars = titleCharsRef.current.filter(Boolean);
    if (chars.length > 0) {
      tl.fromTo(chars, { yPercent: 110 }, { yPercent: 0, duration: 0.45, stagger: 0.025, ease: 'power3.out' });
    } else {
      tl.fromTo(col.firstElementChild, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
    if (benefitsRef.current && benefitsRef.current.children.length > 0) {
      tl.fromTo(
        Array.from(benefitsRef.current.children),
        { opacity: 0, x: -15 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
        '-=0.2'
      );
    }
    if (buttonsRef.current) {
      tl.fromTo(buttonsRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.15');
    }
    return () => {
      tl.kill();
    };
  }, [enterKey, isReducedMotion]);

  // Keep the active mobile chip visible inside its horizontal scroller
  useEffect(() => {
    const row = mobileChipsRef.current;
    const chip = row?.querySelector<HTMLElement>(`[data-index="${displayedSlideIndex}"]`);
    if (!row || !chip) return;
    const left = chip.offsetLeft - (row.clientWidth - chip.clientWidth) / 2;
    row.scrollTo({ left, behavior: 'smooth' });
  }, [displayedSlideIndex]);

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  const arrive = (pose: number) => {
    setPrevPosterIndex(currentSlideRef.current);
    currentSlideRef.current = pose;
    setCurrentSlideIndex(pose);
    setIsTransitioning(false);
    autoElapsedRef.current = 0;
    setAutoProgress(0);
  };

  const runTransition = async (from: number, to: number) => {
    if (videoOffRef.current) {
      await sleep(300);
      return;
    }
    const clips = planClips(from, to);
    try {
      if (clips) {
        for (const step of clips) {
          const v = await playInHiddenSlot(mediaPath(step.file), false, step.rate);
          await waitForEnd(v);
        }
        await playInHiddenSlot(mediaPath(`idle${to}.mp4`), true, 1);
      } else {
        await fadeJumpToIdle(to);
      }
    } catch {
      // A clip failed: try a plain cut to the destination idle, else fall back to posters
      try {
        await fadeJumpToIdle(to);
      } catch {
        disableVideo();
      }
    }
  };

  // Swap the text column right away (old text out, new text in) while the car spins
  const showTextFor = (target: number) => {
    if (textTargetRef.current === target) return;
    textTargetRef.current = target;
    animateTextExit();
    if (textTimerRef.current) window.clearTimeout(textTimerRef.current);
    textTimerRef.current = window.setTimeout(() => {
      textTimerRef.current = null;
      setDisplayedSlideIndex(target);
      setEnterKey((k) => k + 1);
    }, 180);
  };

  const goToSlide = (targetIndex: number, origem: HeroSlideOrigem) => {
    if (origem !== 'auto') markInteraction();

    if (busyRef.current) {
      // Only the most recent request counts
      pendingTargetRef.current = targetIndex;
      showTextFor(targetIndex);
      // Hurry the spin that's playing so the new request starts almost at once
      const playing = visibleSlotRef.current >= 0 ? videoSlots[visibleSlotRef.current].current : null;
      if (playing && !playing.loop) playing.playbackRate = 16;
      return;
    }
    if (targetIndex === currentSlideRef.current) {
      showTextFor(targetIndex);
      return;
    }

    const fromIndex = currentSlideRef.current;
    busyRef.current = true;
    inFlightTargetRef.current = targetIndex;
    setIsTransitioning(true);
    setAutoProgress(0);
    trackHeroSlide(targetIndex, origem);
    showTextFor(targetIndex);

    runTransition(fromIndex, targetIndex).finally(() => {
      arrive(targetIndex);
      busyRef.current = false;
      inFlightTargetRef.current = null;
      const pending = pendingTargetRef.current;
      pendingTargetRef.current = null;
      if (pending !== null && pending !== targetIndex) {
        window.setTimeout(() => goToSlideRef.current(pending, 'aba'), 30);
      }
    });
  };
  goToSlideRef.current = goToSlide;

  const step = (delta: number, origem: HeroSlideOrigem) => {
    // When a transition is running, step relative to where we're heading
    const from = pendingTargetRef.current ?? inFlightTargetRef.current ?? currentSlideRef.current;
    goToSlideRef.current((from + delta + SLIDE_COUNT) % SLIDE_COUNT, origem);
  };

  // Keyboard ← → only while the hero is on screen and focus isn't in another widget
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      if (!isHeroInViewRef.current || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest('input, textarea, select, [role="slider"], [contenteditable="true"]'))) return;
      if (t && t !== document.body && !containerRef.current?.contains(t)) return;
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1, 'teclado');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swipe on the stage
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      step(deltaX < 0 ? 1 : -1, 'swipe');
    }
  };

  // Preload only the clips that leave the current pose (5→0 and 0→5 use a fade, no clip)
  const folder = isMobile ? 'mobile' : 'desktop';
  const preloadClips = [
    currentSlideIndex < SLIDE_COUNT - 1 ? `clip${currentSlideIndex + 1}.mp4` : null,
    currentSlideIndex > 0 ? `clip${currentSlideIndex}_rev.mp4` : null,
  ].filter(Boolean) as string[];

  const currentSlide = HERO_SLIDES[displayedSlideIndex] || HERO_SLIDES[0];
  const showVideo = !videoDisabled && !isReducedMotion;

  // Rebuilt every render so stale nodes from the previous title never get animated
  titleCharsRef.current = [];

  const handleServicesClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    scrollToTarget('#servicos');
  };

  return (
    <section
      ref={containerRef}
      id="hero"
      tabIndex={-1}
      aria-label="Apresentação de Serviços Central Vidros e Acessórios"
      className="relative w-full min-h-[100svh] lg:h-[100svh] bg-central-black text-white overflow-hidden flex flex-col justify-between pt-20 lg:pt-0 focus:outline-none"
    >
      {/* Real accessible H1 */}
      <h1 className="sr-only">Central Vidros e Acessórios – Alta Floresta</h1>

      {/* Main Desktop & Mobile Layout */}
      <div className="w-full max-w-[1720px] mx-auto h-full flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-12 pt-0 pb-4 lg:py-8 flex-1">

        {/* PALCO (Car Stage) — first on mobile */}
        <div
          onMouseEnter={markInteraction}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="order-1 lg:order-2 w-full lg:w-[66%] relative flex flex-col items-center justify-center my-auto"
        >
          {/* 16:9 Stage Container (full width on mobile) */}
          <div className="relative w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-full -mx-4 sm:-mx-6 lg:mx-0 aspect-video max-h-[80svh] overflow-hidden bg-central-black touch-pan-y">

            {/* Media layer: edges fade into the black so the car "floats" (mask on desktop) */}
            <div className="absolute inset-0 hero-stage-mask">
              {/* Poster of the previous pose stays underneath while the new one crossfades in */}
              {prevPosterIndex !== null && prevPosterIndex !== currentSlideIndex && (
                <img
                  key={`prev-${prevPosterIndex}`}
                  src={posterPath(prevPosterIndex)}
                  alt=""
                  aria-hidden="true"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                />
              )}
              <img
                key={`poster-${currentSlideIndex}`}
                src={posterPath(currentSlideIndex)}
                alt="Carro em exibição na Central Vidros e Acessórios"
                decoding="async"
                {...({ fetchpriority: 'high' } as React.HTMLAttributes<HTMLImageElement>)}
                className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none ${
                  prevPosterIndex !== null ? 'animate-in fade-in' : ''
                }`}
              />

              {/* Video slots A / B — the next source always loads in the hidden one */}
              {showVideo &&
                videoSlots.map((ref, slot) => (
                  <video
                    key={slot}
                    ref={ref}
                    muted
                    playsInline
                    preload="auto"
                    disablePictureInPicture
                    aria-hidden="true"
                    className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-opacity duration-150 ${
                      visibleSlot === slot ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}

              {/* Subtle red floor vignette, pulsing slowly */}
              <div
                className="absolute inset-0 pointer-events-none animate-vignette-pulse"
                style={{
                  background: 'radial-gradient(ellipse at bottom, rgba(232, 48, 42, 0.35) 0%, rgba(232, 48, 42, 0) 65%)',
                }}
              />

              {/* Quick black fade transition */}
              <div
                className={`absolute inset-0 bg-central-black pointer-events-none transition-opacity duration-[250ms] ease-in-out ${
                  blackFade ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>

            {/* Callout SVG layer */}
            <HeroCallout slide={HERO_SLIDES[currentSlideIndex] || HERO_SLIDES[0]} visible={!isTransitioning} isReducedMotion={isReducedMotion} />

            {/* Stage navigation arrows */}
            <button
              type="button"
              onClick={() => step(-1, 'seta')}
              aria-label="Ver pose anterior"
              className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-[#0A0A0A]/80 backdrop-blur-md border border-[#1C1C1C] hover:border-central-red hover:bg-central-red text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-central-red"
            >
              <IconChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => step(1, 'seta')}
              aria-label="Ver próxima pose"
              className="absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-[#0A0A0A]/80 backdrop-blur-md border border-[#1C1C1C] hover:border-central-red hover:bg-central-red text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-central-red"
            >
              <IconChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Stage counter ("01 / 05" — pose 0 doesn't count) */}
            {currentSlide.counter && (
              <div className="absolute top-3 left-3 lg:left-auto lg:top-4 lg:right-5 z-20 text-[10px] lg:text-xs font-mono font-bold tracking-widest text-zinc-400 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded border border-[#1C1C1C]">
                <span className="text-white">{currentSlide.counter}</span> / 05
              </div>
            )}

            <span className="absolute bottom-2 right-3 lg:bottom-2.5 lg:right-4 z-20 text-[10px] text-central-gray/80 tracking-wide font-sans pointer-events-none select-none">
              Imagens ilustrativas.
            </span>
          </div>

          {/* Desktop tabs (below stage) */}
          <div className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 mt-4 w-full" role="tablist" aria-label="Seletor de Serviços">
            {HERO_SLIDES.map((s) => {
              const isActive = displayedSlideIndex === s.index;
              return (
                <button
                  key={s.id}
                  id={`tab-${s.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => goToSlide(s.index, 'aba')}
                  className={`relative px-4 py-2.5 text-xs xl:text-sm font-display uppercase tracking-wider transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-central-red rounded-sm ${
                    isActive ? 'text-white font-bold' : 'text-central-gray hover:text-zinc-200'
                  }`}
                >
                  <span>{s.tabLabel}</span>

                  {/* Active red underline */}
                  <span
                    className={`absolute bottom-0 left-2 right-2 h-[2.5px] bg-central-red rounded-full shadow-[0_0_8px_rgba(232,48,42,0.8)] origin-center transition-transform duration-300 ease-out ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />

                  {/* Auto-advance progress under the active tab */}
                  {isActive && !userInteracted && autoProgress > 0 && (
                    <span
                      className="absolute -bottom-1.5 left-2 h-[1.5px] bg-central-red/60 rounded-full transition-[width] duration-100 ease-linear"
                      style={{ width: `calc((100% - 16px) * ${autoProgress / 100})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* MOBILE TABS (horizontal chips with scroll-snap) */}
        <div
          ref={mobileChipsRef}
          className="order-2 lg:hidden w-full overflow-x-auto py-3 no-scrollbar flex items-center gap-2 snap-x snap-mandatory"
          role="tablist"
          aria-label="Seletor de Serviços"
        >
          {HERO_SLIDES.map((s) => {
            const isActive = displayedSlideIndex === s.index;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                data-index={s.index}
                aria-selected={isActive}
                onClick={() => goToSlide(s.index, 'aba')}
                className={`snap-center shrink-0 px-4 py-2 rounded-full text-xs font-display uppercase tracking-wider transition-all duration-200 border active:scale-95 ${
                  isActive
                    ? 'bg-central-red text-white border-central-red font-bold shadow-md'
                    : 'bg-[#141414] text-central-gray border-[#1C1C1C] hover:text-white'
                }`}
              >
                {s.tabLabel}
              </button>
            );
          })}
        </div>

        {/* TEXT COLUMN (left on desktop, under tabs on mobile) */}
        <div
          ref={textColRef}
          className="order-3 lg:order-1 w-full lg:w-[34%] min-h-[380px] lg:min-h-[460px] flex flex-col justify-center px-2 sm:px-6 lg:px-8 py-4 lg:py-6"
        >
          {displayedSlideIndex === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-central-gray">
                {currentSlide.eyebrow}
              </span>

              <div className="leading-none">
                <span className="block text-5xl sm:text-6xl lg:text-7xl font-display font-black uppercase tracking-tight text-white">
                  CENTRAL
                </span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-display font-bold uppercase tracking-widest text-zinc-300 mt-1">
                  Vidros e Acessórios
                </span>
              </div>

              <p className="text-base sm:text-lg text-zinc-300 font-sans">{currentSlide.description}</p>

              <div className="my-1">
                <StatusFuncionamento />
              </div>

              <p className="text-xs text-central-gray font-mono tracking-wide">{currentSlide.hint}</p>

              <div ref={buttonsRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full pt-3">
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOrcamento('hero')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-central-red text-white font-display uppercase tracking-wider text-base font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {currentSlide.ctaText}
                </a>

                <a
                  href="#servicos"
                  onClick={handleServicesClick}
                  className="w-full sm:w-auto px-6 py-3.5 border border-white/40 text-white font-display uppercase tracking-wider text-base font-bold hover:bg-white hover:text-central-black active:scale-95 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Ver todos os serviços
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3.5">
              {currentSlide.counter && (
                <span className="text-sm font-mono font-bold tracking-widest text-central-red">{currentSlide.counter}</span>
              )}

              {/* Big condensed title, split per character for the reveal */}
              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-[1.05]"
                aria-label={currentSlide.title}
              >
                {currentSlide.title.split(' ').map((word, wi, words) => (
                  <span key={`${displayedSlideIndex}-${wi}`} className="inline-block whitespace-nowrap" aria-hidden="true">
                    {word.split('').map((char, ci) => (
                      <span key={ci} className="inline-block overflow-hidden align-top">
                        <span
                          ref={(el) => {
                            if (el) titleCharsRef.current.push(el);
                          }}
                          className="inline-block"
                        >
                          {char}
                        </span>
                      </span>
                    ))}
                    {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
                  </span>
                ))}
              </h2>

              {currentSlide.benefits && (
                <ul ref={benefitsRef} className="space-y-2.5 my-2">
                  {currentSlide.benefits.map((b, i) => (
                    <li key={`${displayedSlideIndex}-${i}`} className="flex items-center gap-3 text-base sm:text-lg text-zinc-200 font-sans">
                      <span className="w-2 h-2 rounded-full bg-central-red shadow-[0_0_6px_rgba(232,48,42,0.8)] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {currentSlide.support && <p className="text-sm sm:text-base text-zinc-400 font-sans">{currentSlide.support}</p>}

              <div ref={buttonsRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full pt-3">
                <a
                  href={waLink(currentSlide.ctaService)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOrcamento('hero', currentSlide.ctaService)}
                  className="w-full sm:w-auto px-7 py-3.5 bg-central-red text-white font-display uppercase tracking-wider text-base font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white flex items-center justify-center gap-2"
                >
                  <span>{currentSlide.ctaText}</span>
                  <IconArrowRight size={18} />
                </a>

                <a
                  href="#servicos"
                  onClick={handleServicesClick}
                  className="w-full sm:w-auto px-6 py-3.5 border border-white/40 text-white font-display uppercase tracking-wider text-base font-bold hover:bg-white hover:text-central-black active:scale-95 transition-all text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Ver todos os serviços
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden preload of neighbouring transition clips */}
      {/* Starts only after the idle is playing, so the first load is just poster + idle */}
      {showVideo && visibleSlot >= 0 && (
        <div className="hidden" aria-hidden="true">
          {preloadClips.map((file) => (
            <video key={`${folder}/${file}`} preload="auto" muted playsInline src={`/hero/${folder}/${file}`} />
          ))}
        </div>
      )}
    </section>
  );
};
