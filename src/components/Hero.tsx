import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { HERO_SLIDES, HeroSlide } from '../config/heroSlides';
import { HeroCallout } from './HeroCallout';
import { StatusFuncionamento } from './StatusFuncionamento';
import { waLink } from '../config/site';
import { trackHeroSlide, trackOrcamento, HeroSlideOrigem } from '../utils/analytics';
import { IconChevronLeft, IconChevronRight, IconArrowRight } from './Icons';

interface HeroProps {
  onPinLeave?: (hasLeft: boolean) => void;
}

export const Hero: React.FC<HeroProps> = ({ onPinLeave }) => {
  const containerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textColRef = useRef<HTMLDivElement>(null);
  const titleCharsRef = useRef<HTMLSpanElement[]>([]);
  const benefitsRef = useRef<HTMLUListElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  // Double video refs
  const videoARef = useRef<HTMLVideoElement>(null);
  const videoBRef = useRef<HTMLVideoElement>(null);

  // States
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [displayedSlideIndex, setDisplayedSlideIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [videoSlotA, setVideoSlotA] = useState<{ src: string; loop: boolean }>({
    src: '/hero/desktop/idle0.mp4',
    loop: true,
  });
  const [videoSlotB, setVideoSlotB] = useState<{ src: string; loop: boolean }>({
    src: '',
    loop: false,
  });
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoDisabled, setVideoDisabled] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [blackFade, setBlackFade] = useState<boolean>(false);
  const [userInteracted, setUserInteracted] = useState<boolean>(false);
  const [autoProgress, setAutoProgress] = useState<number>(0);

  // Mutable refs for state machine & animations
  const currentSlideRef = useRef<number>(0);
  const isTransitioningRef = useRef<boolean>(false);
  const userInteractedRef = useRef<boolean>(false);
  const pendingTargetRef = useRef<number | null>(null);
  const autoTimerRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const isHeroInViewRef = useRef<boolean>(true);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  // Helpers
  const getMediaPath = useCallback((filename: string) => {
    const subfolder = isMobile ? 'mobile' : 'desktop';
    return `/hero/${subfolder}/${filename}`;
  }, [isMobile]);

  const getPosterPath = useCallback((index: number) => {
    const suffix = isMobile ? '-mobile' : '';
    return `/hero/poster/pose${index}${suffix}.webp`;
  }, [isMobile]);

  // Reduced motion and mobile detection
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Update initial video src once mobile status is known
  useEffect(() => {
    if (!videoLoaded) {
      setVideoSlotA({
        src: getMediaPath('idle0.mp4'),
        loop: true,
      });
    }
  }, [getMediaPath, videoLoaded]);

  // Viewport intersection observer to inform Header / MobileStickyBar and pause timer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isHeroInViewRef.current = entry.isIntersecting;
        if (onPinLeave) {
          // If hero is NOT intersecting or scrolled down, header can appear
          onPinLeave(!entry.isIntersecting);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onPinLeave]);

  // Stop auto-advance permanently on interaction
  const markInteraction = useCallback(() => {
    if (!userInteractedRef.current) {
      userInteractedRef.current = true;
      setUserInteracted(true);
      if (autoTimerRef.current) {
        clearTimeout(autoTimerRef.current);
        autoTimerRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setAutoProgress(0);
    }
  }, []);

  // Animate text column exit
  const animateTextExit = useCallback(() => {
    if (!textColRef.current) return Promise.resolve();
    return new Promise<void>((resolve) => {
      gsap.to(textColRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => resolve(),
      });
    });
  }, []);

  // Animate text column enter when car stops
  const animateTextEnter = useCallback((slideIndex: number) => {
    setDisplayedSlideIndex(slideIndex);
    if (!textColRef.current) return;

    if (isReducedMotion) {
      gsap.set(textColRef.current, { opacity: 1, y: 0 });
      return;
    }

    gsap.set(textColRef.current, { opacity: 1, y: 0 });
    const tl = gsap.timeline({ overwrite: 'auto' });

    // 1. Title chars stagger
    const chars = titleCharsRef.current.filter(Boolean);
    if (chars.length > 0) {
      tl.fromTo(
        chars,
        { yPercent: 110 },
        { yPercent: 0, duration: 0.45, stagger: 0.025, ease: 'power3.out' }
      );
    }

    // 2. Benefits stagger
    if (benefitsRef.current) {
      const items = Array.from(benefitsRef.current.children);
      if (items.length > 0) {
        tl.fromTo(
          items,
          { opacity: 0, x: -15 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
          '-=0.2'
        );
      }
    }

    // 3. Buttons & support
    if (buttonsRef.current) {
      tl.fromTo(
        buttonsRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' },
        '-=0.15'
      );
    }
  }, [isReducedMotion]);

  // Restart 7s auto-advance countdown if user hasn't interacted
  const startAutoAdvanceCountdown = useCallback(() => {
    if (userInteractedRef.current || isReducedMotion) return;

    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    const DURATION = 7000;
    const intervalTime = 50;
    let elapsed = 0;
    setAutoProgress(0);

    progressIntervalRef.current = window.setInterval(() => {
      if (document.hidden || !isHeroInViewRef.current) return;
      elapsed += intervalTime;
      const pct = Math.min(100, (elapsed / DURATION) * 100);
      setAutoProgress(pct);
    }, intervalTime);

    autoTimerRef.current = window.setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (!userInteractedRef.current && !document.hidden && isHeroInViewRef.current) {
        // Advance to next
        const nextSlide = (currentSlideRef.current + 1) % 6;
        goToSlide(nextSlide, 'auto');
      }
    }, DURATION);
  }, [isReducedMotion]); // goToSlide is referenced via ref or hoisted

  // Pose Arrival Handler
  const handlePoseArrived = useCallback((poseIndex: number) => {
    currentSlideRef.current = poseIndex;
    setCurrentSlideIndex(poseIndex);
    setIsTransitioning(false);
    isTransitioningRef.current = false;

    // Enter text and callout
    animateTextEnter(poseIndex);

    // Check if there is a pending queue
    if (pendingTargetRef.current !== null && pendingTargetRef.current !== poseIndex) {
      const target = pendingTargetRef.current;
      pendingTargetRef.current = null;
      setTimeout(() => {
        goToSlide(target, 'aba');
      }, 50);
    } else {
      pendingTargetRef.current = null;
      startAutoAdvanceCountdown();
    }
  }, [animateTextEnter, startAutoAdvanceCountdown]);

  // Main Navigation Function
  const goToSlide = useCallback((targetIndex: number, origem: HeroSlideOrigem) => {
    const fromIndex = currentSlideRef.current;
    if (targetIndex === fromIndex && !isTransitioningRef.current) return;

    if (origem !== 'auto') {
      markInteraction();
    }

    // If currently transitioning, enqueue target (only last one counts)
    if (isTransitioningRef.current) {
      pendingTargetRef.current = targetIndex;
      return;
    }

    // Start transition
    setIsTransitioning(true);
    isTransitioningRef.current = true;
    setAutoProgress(0);
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    trackHeroSlide(targetIndex, origem);
    animateTextExit();

    // Reduced motion or video disabled: crossfade between posters
    if (isReducedMotion || videoDisabled) {
      setTimeout(() => {
        handlePoseArrived(targetIndex);
      }, 300);
      return;
    }

    const currentSlot = activeSlot;
    const nextSlot = currentSlot === 'A' ? 'B' : 'A';
    const nextVideo = nextSlot === 'A' ? videoARef.current : videoBRef.current;
    const currentVideo = currentSlot === 'A' ? videoARef.current : videoBRef.current;

    // Helper: switch to idle directly with fast fade to black (250ms fade out + 250ms fade in)
    const doFadeJumpToIdle = (destPose: number) => {
      setBlackFade(true);
      setTimeout(() => {
        const idleSrc = getMediaPath(`idle${destPose}.mp4`);
        if (nextSlot === 'A') {
          setVideoSlotA({ src: idleSrc, loop: true });
        } else {
          setVideoSlotB({ src: idleSrc, loop: true });
        }

        if (nextVideo) {
          nextVideo.playbackRate = 1.0;
          nextVideo.loop = true;
          const onPlay = () => {
            nextVideo.removeEventListener('playing', onPlay);
            setActiveSlot(nextSlot);
            if (currentVideo) currentVideo.pause();
            setTimeout(() => {
              setBlackFade(false);
              handlePoseArrived(destPose);
            }, 50);
          };
          nextVideo.addEventListener('playing', onPlay);
          nextVideo.play().catch(() => {
            setActiveSlot(nextSlot);
            setBlackFade(false);
            handlePoseArrived(destPose);
          });
        } else {
          setActiveSlot(nextSlot);
          setBlackFade(false);
          handlePoseArrived(destPose);
        }
      }, 250);
    };

    // Helper: play a single transition clip then idle
    const playSingleTransition = (clipFile: string, destPose: number, rate = 2.2) => {
      const clipSrc = getMediaPath(clipFile);
      if (nextSlot === 'A') {
        setVideoSlotA({ src: clipSrc, loop: false });
      } else {
        setVideoSlotB({ src: clipSrc, loop: false });
      }

      if (!nextVideo) {
        doFadeJumpToIdle(destPose);
        return;
      }

      nextVideo.playbackRate = rate;
      nextVideo.loop = false;

      let hasMadeVisible = false;
      const onPlaying = () => {
        if (!hasMadeVisible) {
          hasMadeVisible = true;
          setActiveSlot(nextSlot);
          if (currentVideo) currentVideo.pause();
        }
      };

      const onEnded = () => {
        nextVideo.removeEventListener('playing', onPlaying);
        nextVideo.removeEventListener('ended', onEnded);

        // Switch next video to destination idle
        const idleSrc = getMediaPath(`idle${destPose}.mp4`);
        if (nextSlot === 'A') {
          setVideoSlotA({ src: idleSrc, loop: true });
        } else {
          setVideoSlotB({ src: idleSrc, loop: true });
        }
        nextVideo.loop = true;
        nextVideo.playbackRate = 1.0;
        nextVideo.play().catch(() => {});
        handlePoseArrived(destPose);
      };

      nextVideo.addEventListener('playing', onPlaying);
      nextVideo.addEventListener('ended', onEnded);
      nextVideo.play().catch(() => {
        doFadeJumpToIdle(destPose);
      });
    };

    // Helper: sequential chain of 2 clips (playbackRate 3.5)
    const playTwoClipsChain = (
      clip1File: string,
      clip2File: string,
      destPose: number
    ) => {
      const clip1Src = getMediaPath(clip1File);
      if (nextSlot === 'A') {
        setVideoSlotA({ src: clip1Src, loop: false });
      } else {
        setVideoSlotB({ src: clip1Src, loop: false });
      }

      if (!nextVideo) {
        doFadeJumpToIdle(destPose);
        return;
      }

      nextVideo.playbackRate = 3.5;
      nextVideo.loop = false;

      const onClip1Ended = () => {
        nextVideo.removeEventListener('ended', onClip1Ended);
        const clip2Src = getMediaPath(clip2File);
        nextVideo.src = clip2Src;
        nextVideo.playbackRate = 3.5;
        nextVideo.loop = false;

        const onClip2Ended = () => {
          nextVideo.removeEventListener('ended', onClip2Ended);
          const idleSrc = getMediaPath(`idle${destPose}.mp4`);
          nextVideo.src = idleSrc;
          nextVideo.loop = true;
          nextVideo.playbackRate = 1.0;
          nextVideo.play().catch(() => {});
          handlePoseArrived(destPose);
        };

        nextVideo.addEventListener('ended', onClip2Ended);
        nextVideo.play().catch(() => doFadeJumpToIdle(destPose));
      };

      const onPlaying = () => {
        nextVideo.removeEventListener('playing', onPlaying);
        setActiveSlot(nextSlot);
        if (currentVideo) currentVideo.pause();
      };

      nextVideo.addEventListener('playing', onPlaying);
      nextVideo.addEventListener('ended', onClip1Ended);
      nextVideo.play().catch(() => doFadeJumpToIdle(destPose));
    };

    // NAVIGATION DECISION LOGIC:
    // 1. Wrap-around 5 -> 0 or 0 -> 5
    if (fromIndex === 5 && targetIndex === 0) {
      doFadeJumpToIdle(0);
      return;
    }
    if (fromIndex === 0 && targetIndex === 5) {
      doFadeJumpToIdle(5);
      return;
    }

    // 2. Step 1 Forward
    if (targetIndex === fromIndex + 1) {
      playSingleTransition(`clip${targetIndex}.mp4`, targetIndex, 2.2);
      return;
    }

    // 3. Step 1 Backward
    if (targetIndex === fromIndex - 1) {
      playSingleTransition(`clip${fromIndex}_rev.mp4`, targetIndex, 2.2);
      return;
    }

    // 4. Distance 2: Sequential chain (playbackRate 3.5)
    if (targetIndex === fromIndex + 2) {
      const intermediate = fromIndex + 1;
      playTwoClipsChain(`clip${intermediate}.mp4`, `clip${targetIndex}.mp4`, targetIndex);
      return;
    }
    if (targetIndex === fromIndex - 2) {
      const intermediate = fromIndex - 1;
      playTwoClipsChain(`clip${fromIndex}_rev.mp4`, `clip${intermediate}_rev.mp4`, targetIndex);
      return;
    }

    // 5. Distance > 2: Fast fade to black (250ms)
    doFadeJumpToIdle(targetIndex);
  }, [
    activeSlot,
    animateTextExit,
    getMediaPath,
    handlePoseArrived,
    isReducedMotion,
    markInteraction,
    videoDisabled,
  ]);

  // Initial video load (idle 0)
  useEffect(() => {
    const videoA = videoARef.current;
    if (!videoA || isReducedMotion) return;

    const handleInitialCanPlay = () => {
      setVideoLoaded(true);
      videoA.play().catch(() => {
        // Autoplay policy or error -> fallback to poster
        setVideoDisabled(true);
      });
    };

    videoA.addEventListener('canplay', handleInitialCanPlay, { once: true });
    return () => {
      videoA.removeEventListener('canplay', handleInitialCanPlay);
    };
  }, [isReducedMotion]);

  // Keyboard navigation ← →
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = (currentSlideRef.current + 1) % 6;
        goToSlide(next, 'teclado');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = (currentSlideRef.current - 1 + 6) % 6;
        goToSlide(prev, 'teclado');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToSlide]);

  // Swipe handling on stage
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Ensure horizontal gesture
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        // Swipe left -> next
        const next = (currentSlideRef.current + 1) % 6;
        goToSlide(next, 'swipe');
      } else {
        // Swipe right -> prev
        const prev = (currentSlideRef.current - 1 + 6) % 6;
        goToSlide(prev, 'swipe');
      }
    }
  };

  // Preload neighboring clips
  const nextClipNum = currentSlideIndex < 5 ? currentSlideIndex + 1 : 1;
  const prevClipNum = currentSlideIndex > 0 ? currentSlideIndex : 5;

  const currentSlide = HERO_SLIDES[displayedSlideIndex] || HERO_SLIDES[0];

  return (
    <section
      ref={containerRef}
      id="hero"
      tabIndex={0}
      aria-label="Apresentação de Serviços Central Vidros e Acessórios"
      className="relative w-full min-h-[100svh] lg:h-[100svh] bg-central-black text-white overflow-hidden flex flex-col justify-between pt-16 lg:pt-0 focus:outline-none"
    >
      {/* Real accessible H1 */}
      <h1 className="sr-only">Central Vidros e Acessórios – Alta Floresta</h1>

      {/* Main Desktop & Mobile Layout */}
      <div className="w-full max-w-[1720px] mx-auto h-full flex flex-col lg:flex-row items-center justify-between px-4 sm:px-6 lg:px-12 py-4 lg:py-8 flex-1">

        {/* ========================================================================= */}
        {/* MOBILE ORDER: STAGE FIRST (on mobile <1024px) */}
        {/* ========================================================================= */}

        {/* PALCO (Car Stage) */}
        <div
          ref={stageRef}
          onMouseEnter={markInteraction}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="order-1 lg:order-2 w-full lg:w-[66%] relative flex flex-col items-center justify-center my-auto"
        >
          {/* 16:9 Stage Container */}
          <div className="relative w-full aspect-video max-h-[80svh] overflow-hidden rounded-md bg-[#0A0A0A]">

            {/* Stage 4-Edge Gradient Mask Container */}
            <div className="absolute inset-0 hero-stage-mask z-10 pointer-events-none">
              {/* Subtle Red Vignette on Floor */}
              <div
                className="absolute inset-0 pointer-events-none animate-vignette-pulse"
                style={{
                  background: 'radial-gradient(ellipse at bottom, rgba(232, 48, 42, 0.35) 0%, rgba(232, 48, 42, 0) 65%)',
                }}
              />
            </div>

            {/* Poster Backdrop (Underneath videos - Never blank) */}
            <img
              src={getPosterPath(currentSlideIndex)}
              alt="Central Vidros Carro"
              {...({ fetchpriority: 'high' } as React.HTMLAttributes<HTMLImageElement>)}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
            />

            {/* Video Slot A */}
            {!videoDisabled && !isReducedMotion && (
              <video
                ref={videoARef}
                src={videoSlotA.src}
                muted
                playsInline
                loop={videoSlotA.loop}
                preload="auto"
                className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 transition-opacity duration-150 ${
                  activeSlot === 'A' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* Video Slot B */}
            {!videoDisabled && !isReducedMotion && videoSlotB.src && (
              <video
                ref={videoBRef}
                src={videoSlotB.src}
                muted
                playsInline
                loop={videoSlotB.loop}
                preload="auto"
                className={`absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0 transition-opacity duration-150 ${
                  activeSlot === 'B' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            )}

            {/* Quick Black Fade Transition (250ms) */}
            <div
              className={`absolute inset-0 bg-central-black z-30 pointer-events-none transition-opacity duration-250 ease-in-out ${
                blackFade ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Callout SVG Layer */}
            <HeroCallout
              slide={currentSlide}
              visible={!isTransitioning}
              isReducedMotion={isReducedMotion}
            />

            {/* Stage Navigation Arrows */}
            {/* Left Arrow */}
            <button
              type="button"
              onClick={() => {
                const prev = (currentSlideIndex - 1 + 6) % 6;
                goToSlide(prev, 'seta');
              }}
              aria-label="Ver pose anterior"
              className="absolute left-3 lg:left-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-13 lg:h-13 rounded-full bg-[#0A0A0A]/80 backdrop-blur-md border border-[#1C1C1C] hover:border-central-red hover:bg-central-red text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg group focus:outline-none focus:ring-2 focus:ring-central-red"
            >
              <IconChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Right Arrow */}
            <button
              type="button"
              onClick={() => {
                const next = (currentSlideIndex + 1) % 6;
                goToSlide(next, 'seta');
              }}
              aria-label="Ver próxima pose"
              className="absolute right-3 lg:right-6 top-1/2 -translate-y-1/2 z-40 w-11 h-11 lg:w-13 lg:h-13 rounded-full bg-[#0A0A0A]/80 backdrop-blur-md border border-[#1C1C1C] hover:border-central-red hover:bg-central-red text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg group focus:outline-none focus:ring-2 focus:ring-central-red"
            >
              <IconChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Stage Counter ("01 / 05" - Pose 0 doesn't count) */}
            {currentSlide.counter && (
              <div className="absolute top-4 right-5 z-20 text-xs font-mono font-bold tracking-widest text-zinc-400 bg-black/60 backdrop-blur-sm px-3 py-1 rounded border border-[#1C1C1C]">
                <span className="text-white">{currentSlide.counter}</span> / 05
              </div>
            )}

            {/* Illustrative Notice */}
            <span className="absolute bottom-2.5 right-4 z-20 text-[10px] text-central-gray/80 tracking-wide font-sans pointer-events-none select-none">
              Imagens ilustrativas.
            </span>
          </div>

          {/* Desktop Tabs (Below Stage on Desktop) */}
          <div className="hidden lg:flex items-center justify-center gap-1 xl:gap-2 mt-4 w-full" role="tablist" aria-label="Seletor de Serviços">
            {HERO_SLIDES.map((s) => {
              const isActive = currentSlideIndex === s.index;
              return (
                <button
                  key={s.id}
                  id={`tab-${s.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${s.id}`}
                  onClick={() => goToSlide(s.index, 'aba')}
                  className={`relative px-4 py-2.5 text-xs xl:text-sm font-display uppercase tracking-wider transition-all duration-200 focus:outline-none ${
                    isActive ? 'text-white font-bold' : 'text-central-gray hover:text-zinc-200'
                  }`}
                >
                  <span>{s.tabLabel}</span>

                  {/* Animated Active Red Underline */}
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-central-red rounded-full shadow-[0_0_8px_rgba(232,48,42,0.8)]" />
                  )}

                  {/* Auto-advance progress bar underneath active tab */}
                  {isActive && !userInteracted && autoProgress > 0 && (
                    <span
                      className="absolute -bottom-1 left-2 h-[1.5px] bg-central-red/60 rounded-full transition-all duration-50"
                      style={{ width: `calc((100% - 16px) * ${autoProgress / 100})` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE TABS (Chips horizontal row with scroll-snap) */}
        {/* ========================================================================= */}
        <div className="order-2 lg:hidden w-full overflow-x-auto py-3 no-scrollbar scroll-smooth flex items-center gap-2 snap-x snap-mandatory" role="tablist">
          {HERO_SLIDES.map((s) => {
            const isActive = currentSlideIndex === s.index;
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => goToSlide(s.index, 'aba')}
                className={`snap-center shrink-0 px-4 py-2 rounded-full text-xs font-display uppercase tracking-wider transition-all duration-200 border ${
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

        {/* ========================================================================= */}
        {/* TEXT COLUMN (Left ~34% on Desktop, Under Tabs on Mobile) */}
        {/* ========================================================================= */}
        <div
          ref={textColRef}
          className="order-3 lg:order-1 w-full lg:w-[34%] min-h-[380px] lg:min-h-[460px] flex flex-col justify-center px-2 sm:px-6 lg:px-8 py-4 lg:py-6"
        >
          {/* Slide 0: Central Opening */}
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

              <p className="text-base sm:text-lg text-zinc-300 font-sans">
                {currentSlide.description}
              </p>

              {/* Status de Funcionamento */}
              <div className="my-1">
                <StatusFuncionamento />
              </div>

              {/* Hint */}
              <p className="text-xs text-central-gray font-mono tracking-wide">
                {currentSlide.hint}
              </p>

              {/* CTA Button */}
              <div ref={buttonsRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full pt-3">
                <a
                  href={waLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOrcamento('hero')}
                  className="w-full sm:w-auto px-7 py-3.5 bg-central-red text-white font-display uppercase tracking-wider text-base font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-center focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {currentSlide.ctaText}
                </a>

                <a
                  href="#servicos"
                  className="w-full sm:w-auto px-6 py-3.5 border border-white/40 text-white font-display uppercase tracking-wider text-base font-bold hover:bg-white hover:text-central-black active:scale-95 transition-all text-center focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Ver todos os serviços
                </a>
              </div>
            </div>
          ) : (
            /* Slides 1 to 5: Services Content */
            <div className="flex flex-col items-start gap-3.5">
              {/* Red Service Number */}
              {currentSlide.counter && (
                <span className="text-sm font-mono font-bold tracking-widest text-central-red">
                  {currentSlide.counter}
                </span>
              )}

              {/* Big Condensed Title with Character Split */}
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-[1.05]">
                {currentSlide.title.split('').map((char, i) => (
                  <span key={i} className="inline-block overflow-hidden align-top">
                    <span
                      ref={(el) => {
                        if (el) titleCharsRef.current[i] = el;
                      }}
                      className="inline-block"
                    >
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  </span>
                ))}
              </h2>

              {/* Benefits List (Red Bullet) */}
              {currentSlide.benefits && (
                <ul ref={benefitsRef} className="space-y-2.5 my-2">
                  {currentSlide.benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-base sm:text-lg text-zinc-200 font-sans">
                      <span className="w-2 h-2 rounded-full bg-central-red shadow-[0_0_6px_rgba(232,48,42,0.8)] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Support Text */}
              {currentSlide.support && (
                <p className="text-sm sm:text-base text-zinc-400 font-sans">
                  {currentSlide.support}
                </p>
              )}

              {/* Action Buttons */}
              <div ref={buttonsRef} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full pt-3">
                <a
                  href={waLink(currentSlide.ctaService)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOrcamento('hero', currentSlide.ctaService)}
                  className="w-full sm:w-auto px-7 py-3.5 bg-central-red text-white font-display uppercase tracking-wider text-base font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-center focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center gap-2"
                >
                  <span>{currentSlide.ctaText}</span>
                  <IconArrowRight size={18} />
                </a>

                <a
                  href="#servicos"
                  className="w-full sm:w-auto px-6 py-3.5 border border-white/40 text-white font-display uppercase tracking-wider text-base font-bold hover:bg-white hover:text-central-black active:scale-95 transition-all text-center focus:outline-none focus:ring-2 focus:ring-white"
                >
                  Ver todos os serviços
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hidden Preload Elements for neighboring transition clips */}
      <div className="hidden" aria-hidden="true">
        <video preload="auto" muted playsInline src={getMediaPath(`clip${nextClipNum}.mp4`)} />
        <video preload="auto" muted playsInline src={getMediaPath(`clip${prevClipNum}_rev.mp4`)} />
      </div>
    </section>
  );
};
