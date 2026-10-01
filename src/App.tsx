import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Servicos } from './components/Servicos';
import { Insulfilm } from './components/Insulfilm';
import { Cuidados } from './components/Cuidados';
import { Marcas } from './components/Marcas';
import { Avaliacoes } from './components/Avaliacoes';
import { Visite } from './components/Visite';
import { Footer } from './components/Footer';
import { MobileStickyBar } from './components/MobileStickyBar';

gsap.registerPlugin(ScrollTrigger);

export const App: React.FC = () => {
  const [hasPassedHero, setHasPassedHero] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis: Lenis | null = null;

    if (!prefersReducedMotion) {
      // Initialize Lenis smooth scroll
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      // Synchronize Lenis with GSAP ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);

      const tickerCallback = (time: number) => {
        lenis?.raf(time * 1000);
      };

      gsap.ticker.add(tickerCallback);
      gsap.ticker.lagSmoothing(0);

      // Section animations: one orchestrated timeline per section
      const sections = ['#servicos', '#insulfilm', '#cuidados', '#marcas', '#avaliacoes', '#visite'];
      sections.forEach((selector) => {
        const el = document.querySelector(selector);
        if (el) {
          gsap.fromTo(
            el,
            { opacity: 0.9, y: 15 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: el,
                start: 'top 85%',
                toggleActions: 'play none none none',
              },
            }
          );
        }
      });

      // Refresh ScrollTrigger after all assets and fonts finish loading
      window.addEventListener('load', () => {
        ScrollTrigger.refresh();
      });

      return () => {
        gsap.ticker.remove(tickerCallback);
        lenis?.destroy();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    } else {
      // In reduced motion mode, header is visible
      setHasPassedHero(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-central-black text-white relative">
      {/* Fixed Header */}
      <Header visible={hasPassedHero || isMobile} />

      {/* Main Content */}
      <main>
        {/* 1. Hero Service Selector with Turntable Car */}
        <Hero onPinLeave={setHasPassedHero} />

        {/* 3. Serviços */}
        <Servicos />

        {/* 4. Insulfilm */}
        <Insulfilm />

        {/* 5. Cuidados */}
        <Cuidados />

        {/* 6. Marcas */}
        <Marcas />

        {/* 7. Avaliações */}
        <Avaliacoes />

        {/* 8. Visite */}
        <Visite />
      </main>

      {/* 9. Rodapé */}
      <Footer />

      {/* 10. Barra Fixa Mobile */}
      <MobileStickyBar hasPassedHero={hasPassedHero} />
    </div>
  );
};
export default App;
