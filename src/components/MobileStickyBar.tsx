import React, { useState, useEffect } from 'react';
import { waLink } from '../config/site';
import { StatusFuncionamento } from './StatusFuncionamento';
import { IconWhatsApp } from './Icons';
import { trackOrcamento } from '../utils/analytics';

interface MobileStickyBarProps {
  hasPassedHero: boolean;
}

export const MobileStickyBar: React.FC<MobileStickyBarProps> = ({ hasPassedHero }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isVisiteSectionVisible, setIsVisiteSectionVisible] = useState<boolean>(false);
  const [lastScrollY, setLastScrollY] = useState<number>(0);

  // Monitor visibility of #visite section
  useEffect(() => {
    const visiteEl = document.getElementById('visite');
    if (!visiteEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setIsVisiteSectionVisible(entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(visiteEl);
    return () => observer.disconnect();
  }, []);

  // Scroll direction detection (hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (!hasPassedHero || isVisiteSectionVisible) {
        setIsVisible(false);
        setLastScrollY(currentScrollY);
        return;
      }

      // Scrolling down -> hide
      if (currentScrollY > lastScrollY && currentScrollY > 200) {
        setIsVisible(false);
      } else {
        // Scrolling up -> show
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasPassedHero, isVisiteSectionVisible, lastScrollY]);

  if (!hasPassedHero || isVisiteSectionVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-central-black/95 backdrop-blur-md border-t border-central-surface px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] transition-transform duration-300 ease-out shadow-2xl ${
        isVisible ? 'translate-y-0' : 'translate-y-full pointer-events-none'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Compact Operating Status */}
        <div className="flex items-center">
          <StatusFuncionamento compact />
        </div>

        {/* Right: Red WhatsApp Button */}
        <a
          href={waLink()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackOrcamento('barra_mobile')}
          className="flex items-center gap-2 px-5 py-2.5 bg-central-red text-white font-display uppercase tracking-wider text-sm font-bold rounded shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <IconWhatsApp size={17} />
          <span>Orçamento</span>
        </a>
      </div>
    </div>
  );
};
