import React, { useEffect, useState } from 'react';
import {
  ADDRESS,
  PHONE_DISPLAY,
  PHONE_TEL,
  MAPS_URL,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  waLink,
} from '../config/site';
import { StatusFuncionamento } from './StatusFuncionamento';
import { getBusinessStatus } from '../utils/businessHours';
import {
  trackOrcamento,
  trackComoChegar,
  trackTelefone,
  trackInstagram,
} from '../utils/analytics';
import { IconWhatsApp, IconInstagram } from './Icons';

export const Visite: React.FC = () => {
  const [currentDay, setCurrentDay] = useState<number | null>(null);

  useEffect(() => {
    // Calculated strictly on client to avoid hydration mismatch
    const status = getBusinessStatus();
    setCurrentDay(status.currentDay);
  }, []);

  const hoursRows = [
    {
      label: 'Segunda a sexta',
      time: '7h às 18h',
      isCurrentDay: currentDay !== null && currentDay >= 1 && currentDay <= 5,
    },
    {
      label: 'Sábado',
      time: '7h às 12h',
      isCurrentDay: currentDay === 6,
    },
    {
      label: 'Domingo',
      time: 'Fechado',
      isCurrentDay: currentDay === 0,
    },
  ];

  return (
    <section
      id="visite"
      className="scroll-mt-24 py-24 md:py-32 bg-central-dark text-white relative border-t border-central-surface"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="mb-14 md:mb-16">
          <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] uppercase text-central-red mb-3 block">
            Visite a loja
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-display font-black uppercase tracking-tight text-white leading-none">
            Av. Perimetral, 2099.
          </h2>
        </div>

        {/* Layout: Desktop (Left Info, Right Photo), Mobile (Photo top, Info bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Mobile Photo (shown top on mobile, hidden on lg) */}
          <div className="block lg:hidden w-full aspect-[16/10] rounded-sm overflow-hidden bg-central-black border border-central-surface shadow-2xl">
            <picture>
              <source srcSet="/loja/fachada.webp" type="image/webp" />
              <img
                src="/loja/fachada.jpg"
                alt="Fachada Central Vidros e Acessórios"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </picture>
          </div>

          {/* Left Column: Information (lg: 7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            
            {/* Address & Status */}
            <div>
              <p className="text-lg sm:text-xl text-zinc-200 font-sans mb-3">
                {ADDRESS}
              </p>
              <div className="pt-1">
                <StatusFuncionamento />
              </div>
            </div>

            {/* Operating Hours Table with Current Day Highlighted in Red */}
            <div className="bg-central-black border border-central-surface rounded-sm p-6 sm:p-8 max-w-lg shadow-md">
              <span className="text-xs font-mono tracking-widest text-central-gray uppercase block mb-4">
                Horário de funcionamento
              </span>

              <div className="flex flex-col divide-y divide-central-surface">
                {hoursRows.map((row, idx) => (
                  <div
                    key={idx}
                    className={`py-3.5 flex items-center justify-between text-sm sm:text-base font-sans transition-colors ${
                      row.isCurrentDay
                        ? 'text-central-red font-bold'
                        : 'text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {row.isCurrentDay && (
                        <span className="w-1.5 h-1.5 rounded-full bg-central-red inline-block" />
                      )}
                      <span>{row.label}</span>
                    </div>
                    <span className="font-mono text-sm">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phone & Instagram */}
            <div className="flex flex-wrap items-center gap-6 text-sm sm:text-base">
              <div>
                <span className="text-xs text-central-gray block mb-1">Telefone</span>
                <a
                  href={`tel:${PHONE_TEL}`}
                  onClick={trackTelefone}
                  className="font-display font-bold text-xl text-white hover:text-central-red transition-colors"
                >
                  {PHONE_DISPLAY}
                </a>
              </div>

              <div className="h-8 w-[1px] bg-central-surface hidden sm:block" />

              <div>
                <span className="text-xs text-central-gray block mb-1">Instagram</span>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={trackInstagram}
                  className="inline-flex items-center gap-2 font-sans text-zinc-300 hover:text-white transition-colors"
                >
                  <IconInstagram size={18} />
                  <span>{INSTAGRAM_HANDLE}</span>
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackComoChegar}
                className="px-7 py-3.5 border border-white text-white font-display uppercase tracking-wider text-sm font-bold hover:bg-white hover:text-central-black active:scale-95 transition-all text-center"
              >
                Como chegar
              </a>

              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOrcamento('visite')}
                className="px-7 py-3.5 bg-central-red text-white inline-flex items-center justify-center gap-2 font-display uppercase tracking-wider text-sm font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-center"
              >
                <IconWhatsApp size={18} />
                <span>Chamar no WhatsApp</span>
              </a>
            </div>

          </div>

          {/* Right Column: Photo Desktop (lg: 5 cols) */}
          <div className="hidden lg:block lg:col-span-5">
            <div className="relative aspect-[4/3] w-full rounded-sm overflow-hidden bg-central-black border border-central-surface shadow-2xl group">
              <picture>
                <source srcSet="/loja/fachada.webp" type="image/webp" />
                <img
                  src="/loja/fachada.jpg"
                  alt="Fachada Central Vidros e Acessórios em Alta Floresta"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-t from-central-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                <span className="text-xs uppercase font-mono tracking-widest text-zinc-300">
                  Alta Floresta · MT
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
