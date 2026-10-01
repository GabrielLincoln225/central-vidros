import React, { useState, useEffect, useRef } from 'react';
import { GOOGLE_REVIEWS_URL, MOSTRAR_JULIO } from '../config/site';
import { IconStar } from './Icons';

interface Depoimento {
  id: number;
  texto: string;
  autor: string;
}

const ALL_DEPOIMENTOS: Depoimento[] = [
  {
    id: 1,
    texto: 'Ótimo lugar, bom atendimento',
    autor: 'Wilke A.',
  },
  {
    id: 2,
    texto: 'Ótimo Lugar, Bom Atendimento. Serviço de qualidade',
    autor: 'Cleiton J. O.',
  },
  {
    id: 3,
    texto: 'Muito bom a prestação de serviço e manutenção.',
    autor: 'Renan G.',
  },
  {
    id: 4,
    texto: 'Local especializado, com atendimento bacana. [...] Mas indico o local concerteza',
    autor: 'Julio L.',
  },
];

export const Avaliacoes: React.FC = () => {
  const depoimentos = MOSTRAR_JULIO
    ? ALL_DEPOIMENTOS
    : ALL_DEPOIMENTOS.filter((d) => d.id !== 4);

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState<boolean>(false);

  // Check if component is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(entries[0].isIntersecting);
      },
      { threshold: 0.2 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 5s timer with progress bar for desktop featured rotation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || isPaused || !isInView) {
      return;
    }

    const intervalTime = 50; // update progress every 50ms
    const totalTime = 5000;
    const step = (intervalTime / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + step));
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, isInView]);

  // Advance once the bar fills (kept out of the state updater so it runs exactly once)
  useEffect(() => {
    if (progress < 100) return;
    setActiveIndex((cur) => (cur + 1) % depoimentos.length);
    setProgress(0);
  }, [progress, depoimentos.length]);

  const handleSelect = (idx: number) => {
    setActiveIndex(idx);
    setProgress(0);
  };

  const activeItem = depoimentos[activeIndex] || depoimentos[0];

  return (
    <section
      id="avaliacoes"
      ref={containerRef}
      className="scroll-mt-24 py-24 md:py-32 bg-central-black text-white relative border-t border-central-surface"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-20" data-reveal>
          <div>
            <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-central-red mb-3 block">
              Avaliações no Google
            </span>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-none">
              Quem conhece, indica.
            </h2>
          </div>

          {GOOGLE_REVIEWS_URL && !GOOGLE_REVIEWS_URL.startsWith('[') && (
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start md:self-auto inline-flex items-center gap-2 px-5 py-2.5 bg-central-dark hover:bg-central-surface border border-central-surface hover:border-central-gray text-zinc-300 hover:text-white text-xs sm:text-sm font-display uppercase tracking-wider font-bold transition-all rounded-xs"
            >
              <span>Ver todas no Google</span>
              <span>↗</span>
            </a>
          )}
        </div>

        {/* Desktop Layout: Big featured on Left, Clickable Miniatures on Right */}
        <div
          className="hidden md:grid grid-cols-12 gap-10 items-stretch"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Featured Review (7 cols) */}
          <div className="col-span-7 bg-central-dark border border-central-surface rounded-sm p-10 lg:p-14 flex flex-col justify-between relative shadow-2xl">
            {/* Top Red Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-central-surface overflow-hidden">
              <div
                className="h-full bg-central-red transition-all duration-75 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div>
              {/* Header inside featured card: Google badge + 5 Red Stars */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-1.5 text-central-red">
                  {[...Array(5)].map((_, i) => (
                    <IconStar key={i} size={18} />
                  ))}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-central-surface/80 rounded border border-central-gray/20">
                  <span className="text-[11px] font-mono tracking-wider text-zinc-300">
                    Google
                  </span>
                </div>
              </div>

              {/* Big Red Quote Mark & Quote Text */}
              <div className="relative">
                <span className="text-central-red font-display text-7xl lg:text-8xl font-black leading-none block -mb-6 select-none opacity-80">
                  “
                </span>
                <p
                  key={activeItem.id}
                  className="text-2xl lg:text-3xl font-display font-bold uppercase tracking-tight text-white leading-snug animate-in fade-in slide-in-from-bottom-2"
                >
                  {activeItem.texto}
                </p>
              </div>
            </div>

            {/* Author */}
            <div className="mt-10 pt-6 border-t border-central-surface/80 flex items-center justify-between">
              <span key={activeItem.id} className="text-base font-display uppercase tracking-widest text-zinc-300 font-bold animate-in fade-in">
                {activeItem.autor}
              </span>
              <span className="text-xs text-central-gray font-mono">
                5 estrelas
              </span>
            </div>
          </div>

          {/* Miniatures List (5 cols) */}
          <div className="col-span-5 flex flex-col gap-4">
            {depoimentos.map((dep, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={dep.id}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  className={`text-left p-6 rounded-sm border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-central-dark border-central-red shadow-lg translate-x-2'
                      : 'bg-central-black hover:bg-central-dark/70 border-central-surface opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-1 mb-2 text-central-red">
                    {[...Array(5)].map((_, i) => (
                      <IconStar key={i} size={13} />
                    ))}
                  </div>
                  <p className="text-sm font-sans text-zinc-200 line-clamp-2 mb-2">
                    "{dep.texto}"
                  </p>
                  <span className="text-xs font-display uppercase tracking-wider text-central-gray font-bold">
                    {dep.autor}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile Layout: Scroll-snap Carousel */}
        <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5">
          {depoimentos.map((dep) => (
            <div
              key={dep.id}
              className="snap-center shrink-0 w-[85vw] max-w-[340px] bg-central-dark border border-central-surface rounded-sm p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-central-red">
                    {[...Array(5)].map((_, i) => (
                      <IconStar key={i} size={16} />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono tracking-wider text-central-gray uppercase">
                    Google
                  </span>
                </div>
                <p className="text-lg font-display uppercase tracking-tight text-white mb-4 leading-snug">
                  “{dep.texto}”
                </p>
              </div>

              <div className="pt-4 border-t border-central-surface flex items-center justify-between">
                <span className="text-xs font-display uppercase tracking-wider text-zinc-300 font-bold">
                  {dep.autor}
                </span>
                <span className="text-[10px] text-central-gray">5 estrelas</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
