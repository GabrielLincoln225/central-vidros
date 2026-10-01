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
import { setLenis, scrollToTarget } from './utils/scroll';
import { Analytics } from '@vercel/analytics/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

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
    if (prefersReducedMotion) {
      setHasPassedHero(true);
      return;
    }

    // Lenis smooth scroll, driven by GSAP's ticker so ScrollTrigger stays in sync
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Any in-page "#..." link scrolls smoothly with the header offset
    const handleAnchorClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const link = (e.target as HTMLElement | null)?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute('href') || '#';
      if (href !== '#' && !document.querySelector(href)) return;
      e.preventDefault();
      scrollToTarget(href);
    };
    document.addEventListener('click', handleAnchorClick);

    // Scroll reveal animations
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            clearProps: 'transform',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });

      const items = gsap.utils.toArray<HTMLElement>('[data-reveal-item]');
      if (items.length) {
        gsap.set(items, { opacity: 0, y: 40 });
        ScrollTrigger.batch(items, {
          start: 'top 92%',
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power3.out',
              clearProps: 'transform',
              overwrite: true,
            }),
        });
      }
    });

    // Recalculate trigger positions once images/fonts have settled
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh).catch(() => {});

    return () => {
      document.removeEventListener('click', handleAnchorClick);
      window.removeEventListener('load', refresh);
      gsap.ticker.remove(tickerCallback);
      ctx.revert();
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <div className="min-h-screen bg-central-black text-white relative">
      <Header visible={hasPassedHero || isMobile} />

      <main>
        <Hero onPinLeave={setHasPassedHero} />
        <Servicos />
        <Insulfilm />
        <Cuidados />
        <Marcas />
        <Avaliacoes />
        <Visite />
      </main>

      <Footer />

      <MobileStickyBar hasPassedHero={hasPassedHero} />

      <Analytics />
    </div>
  );
};
export default App;
