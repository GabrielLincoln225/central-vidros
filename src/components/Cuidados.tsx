import React from 'react';
import { waLink } from '../config/site';
import { trackOrcamento } from '../utils/analytics';
import { IconArrowRight } from './Icons';

interface CuidadoItem {
  id: number;
  sinal: string;
  solucao: string;
  botaoTexto: string;
  servicoParam: string;
  imagem: string;
}

const CUIDADOS_DATA: CuidadoItem[] = [
  {
    id: 1,
    sinal: 'Ar seco e poeira dentro do carro?',
    solucao:
      'Faça a higienização do ar-condicionado e a troca do filtro de cabine. Ar mais limpo, conforto e saúde pra você e sua família.',
    botaoTexto: 'Agendar avaliação',
    servicoParam: 'higienização do ar-condicionado',
    imagem: '/cuidados/1.webp',
  },
  {
    id: 2,
    sinal: 'Poeira entrando mesmo com os vidros fechados?',
    solucao:
      'Pode ser desgaste nas vedações. Uma inspeção simples identifica o problema antes que ele cause mais transtornos.',
    botaoTexto: 'Agendar avaliação',
    servicoParam: 'avaliação das vedações',
    imagem: '/cuidados/2.webp',
  },
  {
    id: 3,
    sinal: 'Farol amarelado limitando sua visão à noite?',
    solucao:
      'O polimento de farol devolve a transparência e melhora a visibilidade.',
    botaoTexto: 'Fazer orçamento',
    servicoParam: 'polimento de farol',
    imagem: '/cuidados/3.webp',
  },
];

export const Cuidados: React.FC = () => {
  return (
    <section
      id="cuidados"
      className="scroll-mt-24 py-24 md:py-32 bg-central-black text-white relative border-t border-central-surface"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="mb-16 md:mb-20" data-reveal>
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-central-red mb-3 block">
            Fique de olho
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-none">
            Seu carro dá sinais.
          </h2>
        </div>

        {/* 3 Differentiated Blocks: Desktop side by side, Mobile stacked (~80vh each) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {CUIDADOS_DATA.map((item) => (
            <div
              key={item.id}
              data-reveal-item
              className="relative min-h-[480px] lg:min-h-[560px] md:h-auto rounded-sm overflow-hidden flex flex-col justify-end p-8 sm:p-10 border border-central-surface group shadow-xl transition-all duration-500 hover:border-central-red/60"
            >
              {/* Dark Background Image with Subtle Parallax/Hover Scale */}
              <div className="absolute inset-0 z-0 overflow-hidden">
                <picture>
                  <source srcSet={item.imagem} type="image/webp" />
                  <img
                    src={item.imagem}
                    alt={item.sinal}
                    loading="lazy"
                    className="w-full h-full object-cover object-center filter grayscale brightness-[0.65] transition-[transform,filter] duration-700 ease-out group-hover:scale-105 group-hover:brightness-90"
                  />
                </picture>
                
                {/* Heavy Dark Gradient Overlay for Contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-central-black via-central-black/70 to-central-black/20" />
                <div className="absolute inset-0 bg-central-dark/30 mix-blend-multiply" />
              </div>

              {/* Number Badge */}
              <div className="relative z-10 mb-auto pt-2">
                <span className="text-xs font-mono font-bold tracking-widest text-central-red uppercase">
                  Sinal 0{item.id}
                </span>
              </div>

              {/* Content: Question in Large Condensed Italic Display */}
              <div className="relative z-10 mt-12 flex flex-col gap-5">
                <h3 className="text-2xl sm:text-3xl lg:text-3xl font-display font-black italic uppercase tracking-tight text-white leading-tight drop-shadow-md">
                  “{item.sinal}”
                </h3>

                <p className="text-sm sm:text-base text-zinc-300 font-sans leading-relaxed">
                  {item.solucao}
                </p>

                <div className="pt-2">
                  <a
                    href={waLink(item.servicoParam)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackOrcamento('cuidados', item.servicoParam)}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-central-surface hover:bg-central-red border border-central-gray/40 hover:border-central-red text-white text-xs sm:text-sm font-display uppercase tracking-wider font-bold rounded-xs shadow transition-all duration-300 group-hover:translate-x-1"
                  >
                    <span>{item.botaoTexto}</span>
                    <IconArrowRight size={16} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
