import React from 'react';
import {
  CNPJ,
  ADDRESS,
  PHONE_DISPLAY,
  PHONE_TEL,
  EMAIL,
  INSTAGRAM_URL,
  waLink,
} from '../config/site';
import { IconInstagram, IconWhatsApp } from './Icons';
import { trackInstagram, trackOrcamento, trackTelefone } from '../utils/analytics';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-central-black text-central-gray border-t border-central-surface py-16 lg:py-20 relative">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 pb-12 border-b border-central-surface">
          {/* Brand & CNPJ */}
          <div className="max-w-sm flex flex-col gap-4">
            <a
              href="#"
              aria-label="Central Vidros e Acessórios - Topo"
              className="inline-block"
            >
              <img
                src="/brand/logo-central.png"
                alt="Central Vidros e Acessórios"
                width={220}
                height={46}
                className="h-9 w-auto object-contain brightness-95"
              />
            </a>
            <p className="text-xs text-zinc-400 font-mono">
              Central Vidros e Acessórios · CNPJ {CNPJ}
            </p>
          </div>

          {/* Contact & Location Details */}
          <div className="flex flex-col gap-2 text-sm text-zinc-300 font-sans">
            <p className="text-zinc-200">{ADDRESS}</p>
            <p>
              Telefone:{' '}
              <a
                href={`tel:${PHONE_TEL}`}
                onClick={trackTelefone}
                className="text-white hover:text-central-red font-medium transition-colors"
              >
                {PHONE_DISPLAY}
              </a>
            </p>
            <p>
              E-mail:{' '}
              <a
                href={`mailto:${EMAIL}`}
                className="text-white hover:text-central-red font-medium transition-colors"
              >
                {EMAIL}
              </a>
            </p>
          </div>

          {/* Social & Contact Icons */}
          <div className="flex items-center gap-4">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackInstagram}
              aria-label="Instagram da Central Vidros e Acessórios"
              className="w-11 h-11 rounded-sm bg-central-dark hover:bg-central-surface border border-central-surface text-zinc-300 hover:text-white flex items-center justify-center transition-all duration-200"
            >
              <IconInstagram size={20} />
            </a>

            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOrcamento('visite')}
              aria-label="Fazer orçamento no WhatsApp"
              className="w-11 h-11 rounded-sm bg-central-red hover:brightness-110 text-white flex items-center justify-center transition-all duration-200 shadow"
            >
              <IconWhatsApp size={20} />
            </a>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400 font-sans">
          <p>Imagens ilustrativas geradas com auxílio de inteligência artificial.</p>
          <p className="font-mono">Alta Floresta - MT · Desde 2017</p>
        </div>
      </div>
    </footer>
  );
};
