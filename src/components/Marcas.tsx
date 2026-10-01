import React from 'react';

interface MarcaItem {
  name: string;
  file: string;
}

const MARCAS: MarcaItem[] = [
  { name: '3M', file: '/marcas/3m.svg' },
  { name: 'SunTek', file: '/marcas/suntek.svg' },
  { name: 'Roadstar', file: '/marcas/roadstar.svg' },
  { name: 'Grid', file: '/marcas/grid.svg' },
];

export const Marcas: React.FC = () => {
  return (
    <section
      id="marcas"
      className="py-16 md:py-20 bg-central-dark border-t border-central-surface"
      aria-label="Marcas parceiras"
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col items-center">
          {/* Subtle Label */}
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-central-gray mb-10 text-center">
            Marcas que trabalhamos
          </span>

          {/* Logos layout: Thin spaced strip on desktop, 2x2 grid on mobile. No infinite marquee! */}
          <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 items-center justify-items-center">
            {MARCAS.map((marca) => (
              <div
                key={marca.name}
                className="w-full max-w-[160px] h-14 flex items-center justify-center transition-all duration-300 group"
              >
                <img
                  src={marca.file}
                  alt={`Logo ${marca.name}`}
                  loading="lazy"
                  className="max-h-10 w-auto object-contain opacity-60 filter brightness-100 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
