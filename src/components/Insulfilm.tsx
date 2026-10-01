import React, { useState, useRef, useEffect, useCallback } from 'react';
import { waLink } from '../config/site';
import { trackOrcamento, trackUsoAntesDepois } from '../utils/analytics';
import { IconCheck, IconWhatsApp } from './Icons';

type TabKey = 'veiculos' | 'casa' | 'comercio';

interface TabContent {
  title: string;
  items: string[];
}

const TABS_DATA: Record<TabKey, TabContent> = {
  veiculos: {
    title: 'Veículos',
    items: [
      'Proteção térmica com excelente visibilidade.',
      'Bloqueia os raios UV.',
      'Mais privacidade e conforto.',
    ],
  },
  casa: {
    title: 'Casa e escritório',
    items: [
      'Reduz o calor e aumenta o conforto visual.',
      'Aparência moderna e acabamento sofisticado.',
      'Mais proteção e estilo pro seu espaço.',
    ],
  },
  comercio: {
    title: 'Comércio e vitrines',
    items: [
      'Reduz o calor dentro da loja e ajuda a economizar com climatização.',
      'Protege móveis e produtos contra o desbotamento causado pelo sol.',
      'Opções que mantêm a visibilidade da vitrine, sem perder a luz natural.',
    ],
  },
};

export const Insulfilm: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('veiculos');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasAnimatedIntro, setHasAnimatedIntro] = useState<boolean>(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Entrance presentation animation: 50% -> 25% -> 75% -> 50%
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setHasAnimatedIntro(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimatedIntro) {
          setHasAnimatedIntro(true);
          // Run presentation demo
          let step = 0;
          const sequence = [25, 75, 50];
          const runStep = () => {
            if (step < sequence.length) {
              setSliderPos(sequence[step]);
              step++;
              setTimeout(runStep, 450);
            }
          };
          setTimeout(runStep, 300);
        }
      },
      { threshold: 0.3 }
    );

    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimatedIntro]);

  const updatePosition = useCallback((clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pos = Math.min(Math.max((x / rect.width) * 100, 0), 100);
    setSliderPos(pos);
    trackUsoAntesDepois();
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updatePosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    updatePosition(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) updatePosition(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) updatePosition(e.touches[0].clientX);
    };
    const handleEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, updatePosition]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPos((prev) => Math.max(prev - 5, 0));
      trackUsoAntesDepois();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPos((prev) => Math.min(prev + 5, 100));
      trackUsoAntesDepois();
    }
  };

  return (
    <section
      id="insulfilm"
      ref={containerRef}
      className="scroll-mt-24 py-24 md:py-32 bg-central-dark text-white relative border-t border-central-surface"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="mb-14 md:mb-16">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-central-red mb-3 block">
            Insulfilm
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-none">
            Chega de calor excessivo.
          </h2>
        </div>

        {/* Layout: Desktop (60% slider left, 40% tabs right), Mobile (slider top, tabs bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Interactive Before/After Slider (60% / 7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div
              ref={sliderRef}
              role="slider"
              tabIndex={0}
              aria-label="Comparativo antes e depois do insulfilm"
              aria-valuenow={Math.round(sliderPos)}
              aria-valuemin={0}
              aria-valuemax={100}
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              className="relative w-full aspect-[1040/650] rounded-sm overflow-hidden select-none cursor-ew-resize bg-central-black border border-central-surface shadow-2xl focus:outline-none focus:ring-2 focus:ring-central-red"
            >
              {/* After Image (Background: Com película) */}
              <picture className="absolute inset-0 w-full h-full pointer-events-none">
                <source srcSet="/insulfilm/depois.webp" type="image/webp" />
                <img
                  src="/insulfilm/depois.jpg"
                  alt="Vidros com película insulfilm"
                  className="w-full h-full object-cover"
                />
              </picture>

              {/* Before Image (Clipped Overlay: Sem película) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-[clip-path] duration-75"
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                }}
              >
                <picture className="absolute inset-0 w-full h-full">
                  <source srcSet="/insulfilm/antes.webp" type="image/webp" />
                  <img
                    src="/insulfilm/antes.jpg"
                    alt="Vidros claros sem película"
                    className="w-full h-full object-cover"
                  />
                </picture>
              </div>

              {/* Badges in Corners */}
              <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <span className="px-3 py-1 bg-central-black/85 border border-central-surface text-[11px] font-mono tracking-wider uppercase text-zinc-300 rounded-xs">
                  Sem película
                </span>
              </div>
              <div className="absolute top-4 right-4 z-10 pointer-events-none">
                <span className="px-3 py-1 bg-central-black/85 border border-central-red text-[11px] font-mono tracking-wider uppercase text-central-red font-bold rounded-xs">
                  Com película
                </span>
              </div>

              {/* Slider Line & Circular Handle */}
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none transition-[left] duration-75"
                style={{ left: `${sliderPos}%` }}
              >
                {/* Thin vertical dividing line */}
                <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)]" />

                {/* Circular handle with ‹ › */}
                <div className="absolute top-1/2 -left-5 -translate-y-1/2 w-10 h-10 rounded-full bg-central-red border-2 border-white shadow-[0_0_15px_rgba(232,48,42,0.8)] flex items-center justify-center text-white text-xs font-bold">
                  <span>‹›</span>
                </div>
              </div>
            </div>

            {/* Small Notice Below Slider */}
            <span className="text-xs text-central-gray mt-3 tracking-wide">
              Simulação ilustrativa.
            </span>
          </div>

          {/* Right Column: Tabs & Benefits (40% / 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            
            {/* Seal / Badge */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="px-3.5 py-1.5 bg-central-surface border border-central-gray/30 rounded text-xs font-display uppercase tracking-widest text-zinc-200 font-bold">
                Películas 3M e Suntek
              </span>
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-2 p-1 bg-central-black border border-central-surface rounded mb-8">
              {(Object.keys(TABS_DATA) as TabKey[]).map((key) => {
                const isSelected = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-display uppercase tracking-wider font-bold transition-all rounded ${
                      isSelected
                        ? 'bg-central-red text-white shadow-md'
                        : 'text-central-gray hover:text-white hover:bg-central-surface/50'
                    }`}
                  >
                    {TABS_DATA[key].title}
                  </button>
                );
              })}
            </div>

            {/* Tab Items List */}
            <div className="min-h-[160px] flex flex-col gap-4 mb-8">
              {TABS_DATA[activeTab].items.map((item, idx) => (
                <div
                  key={`${activeTab}-${idx}`}
                  className="flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300"
                >
                  <div className="mt-1 w-5 h-5 rounded-full bg-central-surface border border-central-red/40 flex items-center justify-center shrink-0">
                    <IconCheck size={13} className="text-central-red" />
                  </div>
                  <p className="text-base sm:text-lg text-zinc-200 font-sans leading-snug">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div>
              <a
                href={waLink('insulfilm')}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOrcamento('insulfilm', 'insulfilm')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-central-red text-white font-display uppercase tracking-wider text-base font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <IconWhatsApp size={20} />
                <span>Orçamento de insulfilm</span>
              </a>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
