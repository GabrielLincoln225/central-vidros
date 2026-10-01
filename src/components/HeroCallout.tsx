import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { HeroSlide } from '../config/heroSlides';

interface HeroCalloutProps {
  slide: HeroSlide;
  visible: boolean;
  isReducedMotion: boolean;
}

const VIEW_W = 1920;
const VIEW_H = 1080;
// Keep cards this far (in video pixels) from the stage edges
const EDGE_MARGIN = 24;
// Below this rendered stage width the card switches to a compact, text-only label
const MIN_CARD_STAGE_WIDTH = 520;

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export const HeroCallout: React.FC<HeroCalloutProps> = ({ slide, visible, isReducedMotion }) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const centralLogoRef = useRef<SVGImageElement>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [stageWidth, setStageWidth] = useState<number>(0);
  const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);

  const { callout } = slide;

  // Track rendered size so card text stays a constant on-screen size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setStageWidth(el.getBoundingClientRect().width);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = stageWidth > 0 ? stageWidth / VIEW_W : 0.5;
  const unit = 1 / scale; // video pixels per screen pixel
  const showCard = stageWidth >= MIN_CARD_STAGE_WIDTH;

  // Measure the card (in video pixels) so it can be kept inside the stage
  useIsoLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) {
      setCardSize(null);
      return;
    }
    const r = card.getBoundingClientRect();
    const w = Math.round(r.width * unit);
    const h = Math.round(r.height * unit);
    setCardSize((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
  }, [slide.index, unit, showCard, logoErrors]);

  // Card placement: configured position, pulled back inside the stage if needed
  let cardX = callout?.card.x ?? 0;
  let cardY = callout?.card.y ?? 0;
  const lineY = callout?.cardEnd?.y ?? cardY;
  if (callout && cardSize) {
    const { w, h } = cardSize;
    cardX = Math.min(cardX, VIEW_W - EDGE_MARGIN - w);
    // The horizontal line must meet the card's side; otherwise center the card on it
    if (lineY < cardY + h * 0.2 || lineY > cardY + h * 0.8) cardY = lineY - h / 2;
    cardY = Math.max(EDGE_MARGIN, Math.min(cardY, VIEW_H - EDGE_MARGIN - h));
  }
  const elbowX = callout?.elbow?.x ?? cardX;
  const lineEndX = Math.max(elbowX, cardX);
  const layoutKey = `${slide.index}:${Math.round(cardX)}:${Math.round(cardY)}:${showCard}`;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!visible || !callout) {
      gsap.to(container, { opacity: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
      return;
    }

    const path = pathRef.current;
    const card = cardRef.current;
    const pathLength = path ? path.getTotalLength() : 0;

    if (isReducedMotion) {
      gsap.set(container, { opacity: 1 });
      if (path) gsap.set(path, { strokeDasharray: 'none', strokeDashoffset: 0 });
      if (card) gsap.set(card, { clipPath: 'inset(0% 0% 0% 0%)' });
      if (card) gsap.set(card.children, { opacity: 1, y: 0 });
      if (centralLogoRef.current) gsap.set(centralLogoRef.current, { opacity: 0.9, y: 0 });
      return;
    }

    gsap.killTweensOf(container);
    gsap.set(container, { opacity: 1 });
    const tl = gsap.timeline();

    if (callout.isCentralLogo && centralLogoRef.current) {
      tl.fromTo(centralLogoRef.current, { opacity: 0, y: -10 }, { opacity: 0.9, y: 0, duration: 0.6, ease: 'power2.out' });
    } else {
      // 1. point is already pulsing · 2. line draws · 3. card opens from the line tip · 4. contents stagger
      if (path && pathLength > 0) {
        gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
        tl.to(path, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.inOut' });
      }
      if (card) {
        gsap.set(card, { clipPath: 'inset(0% 100% 0% 0%)' });
        gsap.set(card.children, { opacity: 0, y: 5 });
        tl.to(card, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.35, ease: 'power3.out' }, '-=0.05');
        tl.to(card.children, { opacity: 1, y: 0, duration: 0.25, stagger: 0.08, ease: 'power2.out' }, '-=0.15');
      }
    }

    return () => {
      tl.kill();
    };
  }, [visible, callout, isReducedMotion, layoutKey]);

  if (!callout) return null;

  const hasLine = !callout.isCentralLogo && callout.point && callout.elbow && callout.cardEnd;

  return (
    <svg
      ref={containerRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="callout-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Pose 0: Central logo, discreet at the top */}
      {callout.isCentralLogo && (
        <image
          ref={centralLogoRef}
          href="/brand/logo-central.png"
          x={VIEW_W / 2 - 160}
          y={callout.card.y}
          width="320"
          height="68"
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: 0 }}
        />
      )}

      {/* Poses 1–5: point, elbow line and card */}
      {hasLine && callout.point && callout.elbow && callout.cardEnd && (
        <g>
          <circle
            cx={callout.point.x}
            cy={callout.point.y}
            r="8"
            fill="none"
            stroke="#E8302A"
            strokeWidth="2.5"
            className={isReducedMotion ? '' : 'animate-callout-pulse'}
          />
          <circle cx={callout.point.x} cy={callout.point.y} r="8" fill="#E8302A" filter="url(#callout-glow)" />
          <circle cx={callout.point.x} cy={callout.point.y} r="2.5" fill="#FFFFFF" />

          {/* 1.5px on screen, regardless of stage size */}
          <path
            ref={pathRef}
            d={`M ${callout.point.x} ${callout.point.y} L ${callout.elbow.x} ${lineY} L ${lineEndX} ${lineY}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={1.5 * unit}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <foreignObject
            x={cardX}
            y={cardY}
            width={Math.max(1, VIEW_W - cardX)}
            height={Math.max(1, VIEW_H - cardY)}
            style={{ overflow: 'visible' }}
          >
            <div
              ref={cardRef}
              className="border-solid border-[#1C1C1C] border-t-central-red rounded-sm inline-flex flex-col justify-center"
              style={{
                backgroundColor: 'rgba(10, 10, 10, 0.85)',
                clipPath: isReducedMotion ? 'none' : 'inset(0% 100% 0% 0%)',
                padding: showCard ? `${10 * unit}px ${14 * unit}px` : `${4 * unit}px ${8 * unit}px`,
                gap: `${6 * unit}px`,
                borderWidth: `${1 * unit}px`,
                borderTopWidth: `${2 * unit}px`,
                boxShadow: `0 ${10 * unit}px ${25 * unit}px rgba(0,0,0,0.8)`,
              }}
            >
              {showCard && callout.brands && callout.brands.length > 0 && (
                <div className="flex items-center flex-nowrap" style={{ gap: `${12 * unit}px` }}>
                  {callout.brands.map((b) =>
                    b.logoUrl && !logoErrors[b.name] ? (
                      <img
                        key={b.name}
                        src={b.logoUrl}
                        alt={b.name}
                        onError={() => setLogoErrors((prev) => ({ ...prev, [b.name]: true }))}
                        className="w-auto object-contain"
                        style={{ height: `${18 * unit}px`, filter: 'brightness(0) invert(1)' }}
                      />
                    ) : (
                      // Logo missing: brand name as text, same footprint
                      <span
                        key={b.name}
                        className="font-mono font-bold tracking-wider text-white uppercase bg-white/10 rounded whitespace-nowrap"
                        style={{ fontSize: `${11 * unit}px`, padding: `${2 * unit}px ${6 * unit}px` }}
                      >
                        {b.name}
                      </span>
                    )
                  )}
                </div>
              )}
              <div
                className="text-white font-display font-bold tracking-wide uppercase leading-tight whitespace-nowrap"
                style={{ fontSize: `${(showCard ? 15 : 10) * unit}px` }}
              >
                {callout.text}
              </div>
            </div>
          </foreignObject>
        </g>
      )}
    </svg>
  );
};
