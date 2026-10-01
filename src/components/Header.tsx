import React, { useState, useEffect } from 'react';
import { waLink, INSTAGRAM_URL, PHONE_DISPLAY, PHONE_TEL } from '../config/site';
import { IconInstagram, IconWhatsApp, IconMenu, IconClose } from './Icons';
import { trackOrcamento, trackInstagram, trackTelefone } from '../utils/analytics';

interface HeaderProps {
  visible: boolean;
}

export const Header: React.FC<HeaderProps> = ({ visible }) => {
  const [activeSection, setActiveSection] = useState<string>('servicos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const navLinks = [
    { label: 'Serviços', href: '#servicos', id: 'servicos' },
    { label: 'Insulfilm', href: '#insulfilm', id: 'insulfilm' },
    { label: 'Avaliações', href: '#avaliacoes', id: 'avaliacoes' },
    { label: 'Visite', href: '#visite', id: 'visite' },
  ];

  useEffect(() => {
    // Scroll spy for active section
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      const sections = ['servicos', 'insulfilm', 'avaliacoes', 'visite'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-central-black/90 backdrop-blur-md border-b border-central-surface transition-all duration-500 ease-out ${
          visible
            ? 'translate-y-0 opacity-100'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand Logo */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-central-red focus:ring-offset-2 focus:ring-offset-central-black rounded"
            aria-label="Central Vidros e Acessórios - Voltar ao topo"
          >
            <img
              src="/brand/logo-central.png"
              alt="Central Vidros e Acessórios"
              width={200}
              height={42}
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]"
            />
          </a>

          {/* Center (Desktop): Navigation links with animated active indicator */}
          <nav className="hidden md:flex items-center gap-8 relative" aria-label="Navegação Principal">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`text-sm font-display tracking-wider uppercase py-2 px-1 relative transition-colors duration-200 ${
                    isActive ? 'text-white font-bold' : 'text-central-gray hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-central-red shadow-[0_0_8px_rgba(232,48,42,0.6)] animate-in fade-in duration-200" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right (Desktop): Instagram + Orçamento button */}
          <div className="hidden md:flex items-center gap-5">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackInstagram}
              aria-label="Instagram da Central Vidros e Acessórios"
              className="p-2 text-central-gray hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-central-red rounded-full"
            >
              <IconInstagram size={20} />
            </a>

            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackOrcamento('header')}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-sm bg-central-red text-white font-display uppercase tracking-wider text-sm font-bold shadow-md hover:brightness-110 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-central-black"
            >
              Orçamento
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Abrir menu de navegação"
            className="md:hidden p-2 text-white hover:text-central-red transition-colors focus:outline-none"
          >
            <IconMenu size={26} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer / Sheet */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sheet Panel */}
          <div className="relative w-full max-w-xs bg-central-dark border-l border-central-surface p-6 flex flex-col justify-between h-full shadow-2xl z-10">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-central-surface">
                <img
                  src="/brand/logo-central.png"
                  alt="Central"
                  width={160}
                  height={34}
                  className="h-7 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fechar menu"
                  className="p-2 text-central-gray hover:text-white transition-colors"
                >
                  <IconClose size={24} />
                </button>
              </div>

              {/* Navigation */}
              <nav className="mt-8 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    className={`text-xl font-display uppercase tracking-wide py-2 ${
                      activeSection === link.id
                        ? 'text-central-red font-bold'
                        : 'text-zinc-300 hover:text-white'
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>

            {/* Bottom Contact Details */}
            <div className="pt-6 border-t border-central-surface flex flex-col gap-4">
              <a
                href={`tel:${PHONE_TEL}`}
                onClick={trackTelefone}
                className="text-sm font-medium text-central-gray hover:text-white transition-colors"
              >
                {PHONE_DISPLAY}
              </a>

              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackInstagram}
                className="inline-flex items-center gap-2 text-sm font-medium text-central-gray hover:text-white transition-colors"
              >
                <IconInstagram size={18} />
                <span>Instagram</span>
              </a>

              <a
                href={waLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackOrcamento('header');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded bg-central-red text-white font-display uppercase tracking-wider font-bold hover:brightness-110 active:scale-95 transition-all"
              >
                <IconWhatsApp size={18} />
                <span>Orçamento no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
