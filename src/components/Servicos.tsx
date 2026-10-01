import React, { useState, useRef, useEffect } from 'react';
import { waLink } from '../config/site';
import { trackOrcamento } from '../utils/analytics';
import { IconArrowRight, IconWhatsApp } from './Icons';

interface ServicoItem {
  slug: string;
  num: string;
  nome: string;
  descricao: string;
}

const SERVICOS: ServicoItem[] = [
  {
    slug: 'insulfilm',
    num: '01',
    nome: 'Insulfilm',
    descricao: 'Veículos, residencial e comercial. Reduz o calor, bloqueia os raios UV e dá mais privacidade.',
  },
  {
    slug: 'vidros',
    num: '02',
    nome: 'Vidros e para-brisa',
    descricao: 'Troca de vidros e para-brisa, avaliação e manutenção de vedações.',
  },
  {
    slug: 'ar-condicionado',
    num: '03',
    nome: 'Ar-condicionado',
    descricao: 'Ar-condicionado automotivo, higienização e troca do filtro de cabine.',
  },
  {
    slug: 'iluminacao',
    num: '04',
    nome: 'Iluminação',
    descricao: 'Faróis, lanternas, conectores, relés, fusíveis e polimento de farol.',
  },
  {
    slug: 'som',
    num: '05',
    nome: 'Som e multimídia',
    descricao: 'Som automotivo e multimídia com instalação profissional.',
  },
  {
    slug: 'acessorios',
    num: '06',
    nome: 'Acessórios',
    descricao: 'Volantes, calotas, capotas e acessórios pra deixar o carro mais completo.',
  },
  {
    slug: 'tapecaria',
    num: '07',
    nome: 'Tapeçaria',
    descricao: 'Tapeçaria automotiva.',
  },
  {
    slug: 'alarmes',
    num: '08',
    nome: 'Alarmes, travas e fechaduras',
    descricao: 'Instalação de alarmes e travas e manutenção de fechaduras.',
  },
  {
    slug: 'envelopamento',
    num: '09',
    nome: 'Envelopamento',
    descricao: 'Envelopamento automotivo.',
  },
];

export const Servicos: React.FC = () => {
  const [activeSlug, setActiveSlug] = useState<string>(SERVICOS[0].slug);
  const [mobileOpenSlug, setMobileOpenSlug] = useState<string | null>(SERVICOS[0].slug);
  const rowsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Scroll spy on desktop to detect which service row is near center of viewport
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 768) return;
      const centerY = window.innerHeight / 2;

      let closestSlug = activeSlug;
      let minDistance = Infinity;

      rowsRef.current.forEach((row, index) => {
        if (!row) return;
        const rect = row.getBoundingClientRect();
        const rowCenter = rect.top + rect.height / 2;
        const distance = Math.abs(rowCenter - centerY);

        if (distance < minDistance && rect.top < window.innerHeight && rect.bottom > 0) {
          minDistance = distance;
          closestSlug = SERVICOS[index].slug;
        }
      });

      if (closestSlug !== activeSlug && minDistance < 250) {
        setActiveSlug(closestSlug);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSlug]);

  const activeItem = SERVICOS.find((s) => s.slug === activeSlug) || SERVICOS[0];

  return (
    <section
      id="servicos"
      className="scroll-mt-24 py-24 md:py-32 bg-central-black text-white relative border-t border-central-surface"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="mb-16 md:mb-20" data-reveal>
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-central-red mb-3 block">
            Serviços
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-none">
            Tudo o que o seu carro precisa.
          </h2>
        </div>

        {/* Desktop Editorial 2-Column Layout */}
        <div className="hidden md:grid grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Sticky Column (40% width / 5 cols) */}
          <div className="col-span-5 sticky top-32">
            <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-central-dark border border-central-surface shadow-2xl">
              {SERVICOS.map((servico) => {
                const isCurrent = servico.slug === activeSlug;
                return (
                  <div
                    key={servico.slug}
                    className={`absolute inset-0 transition-all duration-700 ease-out ${
                      isCurrent
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-105 pointer-events-none'
                    }`}
                  >
                    <picture>
                      <source srcSet={`/servicos/${servico.slug}.webp`} type="image/webp" />
                      <img
                        src={`/servicos/${servico.slug}.webp`}
                        alt={`Serviço ${servico.nome}`}
                        width={1000}
                        height={700}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </picture>
                    <div className="absolute inset-0 bg-gradient-to-t from-central-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between">
                      <span className="text-central-red font-display text-2xl font-black">
                        {servico.num}
                      </span>
                      <span className="text-xs uppercase font-mono tracking-widest text-zinc-300">
                        {servico.nome}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Editorial Services List (60% width / 7 cols) */}
          <div className="col-span-7 divide-y divide-central-surface border-y border-central-surface">
            {SERVICOS.map((servico, index) => {
              const isActive = activeSlug === servico.slug;
              return (
                <div
                  key={servico.slug}
                  ref={(el) => (rowsRef.current[index] = el)}
                  onMouseEnter={() => setActiveSlug(servico.slug)}
                  className={`py-8 transition-all duration-300 cursor-pointer group ${
                    isActive ? 'pl-4' : 'hover:pl-2'
                  }`}
                >
                  <div className="flex items-baseline gap-6">
                    <span
                      className={`font-display text-2xl lg:text-3xl font-black transition-colors ${
                        isActive ? 'text-central-red' : 'text-central-gray group-hover:text-zinc-400'
                      }`}
                    >
                      {servico.num}
                    </span>

                    <div className="flex-1">
                      <div className="relative inline-block">
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black uppercase tracking-tight text-white transition-colors">
                          {servico.nome}
                        </h3>
                        {/* Underline drawing under active service */}
                        <div
                          className={`h-0.5 bg-central-red transition-all duration-500 ease-out origin-left ${
                            isActive ? 'w-full scale-x-100' : 'w-0 scale-x-0'
                          }`}
                        />
                      </div>

                      {/* Description & Button visible only on active service */}
                      <div
                        className={`transition-all duration-500 ease-out overflow-hidden ${
                          isActive
                            ? 'max-h-40 opacity-100 mt-4'
                            : 'max-h-0 opacity-0 mt-0 pointer-events-none'
                        }`}
                      >
                        <p className="text-zinc-300 text-base lg:text-lg mb-4 max-w-xl font-sans">
                          {servico.descricao}
                        </p>
                        
                        <a
                          href={waLink(servico.nome)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackOrcamento('servicos', servico.nome);
                          }}
                          className="inline-flex items-center gap-2 text-sm font-display font-bold uppercase tracking-wider text-central-red hover:text-white transition-colors"
                        >
                          <span>Orçamento</span>
                          <IconArrowRight size={18} />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Accordion */}
        <div className="md:hidden divide-y divide-central-surface border-y border-central-surface">
          {SERVICOS.map((servico) => {
            const isOpen = mobileOpenSlug === servico.slug;
            return (
              <div key={servico.slug} className="py-5">
                <button
                  type="button"
                  onClick={() => setMobileOpenSlug(isOpen ? null : servico.slug)}
                  className="w-full text-left flex items-center justify-between gap-4 group"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-central-red font-display font-black text-xl">
                      {servico.num}
                    </span>
                    <h3 className="text-xl font-display font-black uppercase text-white">
                      {servico.nome}
                    </h3>
                  </div>
                  <span
                    className={`text-central-gray transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-central-red' : ''
                    }`}
                  >
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-2 flex flex-col gap-4 animate-in fade-in duration-300">
                    <div className="aspect-[16/10] w-full rounded overflow-hidden bg-central-dark border border-central-surface">
                      <img
                        src={`/servicos/${servico.slug}.webp`}
                        alt={servico.nome}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-zinc-300 text-sm font-sans">
                      {servico.descricao}
                    </p>
                    <a
                      href={waLink(servico.nome)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackOrcamento('servicos', servico.nome)}
                      className="w-full py-3 bg-central-red text-white flex items-center justify-center gap-2 font-display uppercase tracking-wider font-bold text-sm rounded shadow hover:brightness-110 active:scale-95 transition-all"
                    >
                      <IconWhatsApp size={18} />
                      <span>Orçamento no WhatsApp</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Editorial Callout */}
        <div data-reveal className="mt-16 md:mt-24 p-8 md:p-10 bg-central-dark border border-central-surface rounded-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-central-gray block mb-1">
              Atendimento amplo
            </span>
            <p className="text-lg md:text-2xl font-display font-bold text-white uppercase tracking-tight">
              Também atendemos carros antigos e máquinas agrícolas.
            </p>
          </div>

          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOrcamento('servicos', 'geral')}
            className="w-full md:w-auto px-7 py-3.5 bg-central-red text-white font-display uppercase tracking-wider text-sm font-bold shadow hover:brightness-110 active:scale-95 transition-all text-center"
          >
            Falar com a equipe
          </a>
        </div>
      </div>
    </section>
  );
};
