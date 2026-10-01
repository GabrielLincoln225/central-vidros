import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { HeroSlide } from '../config/heroSlides';

interface HeroCalloutProps {
  slide: HeroSlide;
  visible: boolean;
  isReducedMotion: boolean;
}

export const HeroCallout: React.FC<HeroCalloutProps> = ({
  slide,
  visible,
  isReducedMotion,
}) => {
  const containerRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const cardRef = useRef<SVGForeignObjectElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const centralLogoRef = useRef<SVGImageElement>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});

  const { callout } = slide;

  // Handle Logo Load Error
  const handleLogoError = (brandName: string) => {
    setLogoErrors((prev) => ({ ...prev, [brandName]: true }));
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!visible || !callout) {
      // Fast fade out
      gsap.to(container, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
      return;
    }

    // Visible state
    if (isReducedMotion) {
      gsap.set(container, { opacity: 1 });
      if (pathRef.current) gsap.set(pathRef.current, { strokeDashoffset: 0 });
      if (cardRef.current) gsap.set(cardRef.current, { clipPath: 'inset(0% 0% 0% 0%)' });
      if (contentRef.current) gsap.set(contentRef.current, { opacity: 1 });
      if (centralLogoRef.current) gsap.set(centralLogoRef.current, { opacity: 0.85 });
      return;
    }

    // GSAP Entry sequence (~0.9s)
    const tl = gsap.timeline({ overwrite: 'auto' });

    // Show container
    gsap.set(container, { opacity: 1 });

    if (callout.isCentralLogo && centralLogoRef.current) {
      // Central logo fade in
      tl.fromTo(
        centralLogoRef.current,
        { opacity: 0, y: -10 },
        { opacity: 0.85, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    } else if (callout.point && callout.elbow && callout.cardEnd) {
      const P = callout.point;
      const E = callout.elbow;
      const C = callout.cardEnd;

      const pathLength = Math.abs(E.y - P.y) + Math.abs(C.x - E.x);

      // Reset states
      if (pathRef.current) {
        gsap.set(pathRef.current, {
          strokeDasharray: pathLength,
          strokeDashoffset: pathLength,
        });
      }
      if (cardRef.current) {
        gsap.set(cardRef.current, { clipPath: 'inset(0% 100% 0% 0%)' });
      }
      if (contentRef.current) {
        const children = contentRef.current.children;
        gsap.set(children, { opacity: 0, y: 5 });
      }

      // 1. Point appears instantly / already pulsed
      // 2. White line draws from point to card (DrawSVG effect, ~0.35s)
      if (pathRef.current) {
        tl.to(pathRef.current, {
          strokeDashoffset: 0,
          duration: 0.35,
          ease: 'power2.inOut',
        });
      }

      // 3. Card opens from tip of line: clip-path inset opens left to right (0.35s)
      if (cardRef.current) {
        tl.to(
          cardRef.current,
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 0.35,
            ease: 'power3.out',
          },
          '-=0.05'
        );
      }

      // 4. Stagger logos then text inside card (~0.25s)
      if (contentRef.current) {
        const children = contentRef.current.children;
        tl.to(
          children,
          {
            opacity: 1,
            y: 0,
            duration: 0.25,
            stagger: 0.08,
            ease: 'power2.out',
          },
          '-=0.15'
        );
      }
    }

    return () => {
      tl.kill();
    };
  }, [visible, slide.index, callout, isReducedMotion]);

  if (!callout) return null;

  return (
    <svg
      ref={containerRef}
      viewBox="0 0 1920 1080"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-20 transition-opacity duration-200"
      style={{ opacity: 0 }}
      aria-hidden="true"
    >
      <defs>
        {/* Glow filter for callout point */}
        <filter id="callout-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Case 1: Pose 0 Central Logo */}
      {callout.isCentralLogo && (
        <g>
          <image
            ref={centralLogoRef}
            href="/brand/logo-central.png"
            x={1920 / 2 - 130}
            y={callout.card.y}
            width="260"
            height="55"
            preserveAspectRatio="xMidYMid meet"
            className="filter brightness-0 invert opacity-80 transition-opacity duration-300"
          />
        </g>
      )}

      {/* Case 2: Poses 1 to 5 with point, line, and card */}
      {!callout.isCentralLogo && callout.point && callout.elbow && callout.cardEnd && (
        <g>
          {/* 1. Point on the part: red circle r=8 + pulsing ring */}
          <g>
            {/* Pulsing ring */}
            <circle
              cx={callout.point.x}
              cy={callout.point.y}
              r="8"
              fill="none"
              stroke="#E8302A"
              strokeWidth="2.5"
              className={isReducedMotion ? '' : 'animate-callout-pulse'}
            />
            {/* Core red point */}
            <circle
              cx={callout.point.x}
              cy={callout.point.y}
              r="8"
              fill="#E8302A"
              filter="url(#callout-glow)"
            />
            {/* Tiny center white dot */}
            <circle
              cx={callout.point.x}
              cy={callout.point.y}
              r="2.5"
              fill="#FFFFFF"
            />
          </g>

          {/* 2. White line 1.5px with elbow */}
          <path
            ref={pathRef}
            d={`M ${callout.point.x} ${callout.point.y} L ${callout.elbow.x} ${callout.elbow.y} L ${callout.cardEnd.x} ${callout.cardEnd.y}`}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 3. Card opening from tip of line */}
          <foreignObject
            ref={cardRef}
            x={callout.card.x}
            y={callout.card.y}
            width={callout.card.width || 280}
            height="110"
            style={{
              clipPath: isReducedMotion ? 'none' : 'inset(0% 100% 0% 0%)',
              overflow: 'visible',
            }}
          >
            <div
              ref={contentRef}
              className="bg-[#0A0A0A]/90 backdrop-blur-md border border-[#1C1C1C] border-t-2 border-t-central-red shadow-2xl px-4 py-3 rounded-sm flex flex-col justify-center gap-1.5"
              style={{
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.8), 0 0 15px rgba(232, 48, 42, 0.2)',
              }}
            >
              {/* Brands Row */}
              {callout.brands && callout.brands.length > 0 && (
                <div className="flex items-center gap-4 flex-wrap pb-0.5">
                  {callout.brands.map((b) => (
                    <div key={b.name} className="flex items-center">
                      {b.logoUrl && !logoErrors[b.name] ? (
                        <img
                          src={b.logoUrl}
                          alt={b.name}
                          onError={() => handleLogoError(b.name)}
                          className="h-5 w-auto object-contain text-white filter brightness-0 invert opacity-90 hover:opacity-100 transition-opacity"
                        />
                      ) : (
                        <span className="text-xs font-mono font-bold tracking-wider text-white uppercase bg-white/10 px-1.5 py-0.5 rounded">
                          {b.name}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Service short text */}
              <div className="text-white font-display text-base font-bold tracking-wide uppercase leading-tight drop-shadow">
                {callout.text}
              </div>
            </div>
          </foreignObject>
        </g>
      )}
    </svg>
  );
};
