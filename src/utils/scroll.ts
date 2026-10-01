import type Lenis from 'lenis';

// Shared Lenis instance so any component can scroll smoothly without fighting it
let lenisInstance: Lenis | null = null;

export function setLenis(lenis: Lenis | null): void {
  lenisInstance = lenis;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}

const HEADER_OFFSET = 80;

export function scrollToTarget(target: string | number): void {
  if (typeof window === 'undefined') return;

  if (typeof target === 'number' || target === '#' || target === '#top') {
    const y = typeof target === 'number' ? target : 0;
    if (lenisInstance) lenisInstance.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
    return;
  }

  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;

  // Compute the position ourselves: Lenis would otherwise add CSS scroll-margin on top of the offset
  const top = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);
  if (lenisInstance) {
    lenisInstance.scrollTo(top, { duration: 1.2 });
  } else {
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

export function lockScroll(locked: boolean): void {
  if (lenisInstance) {
    if (locked) lenisInstance.stop();
    else lenisInstance.start();
  }
  document.body.style.overflow = locked ? 'hidden' : '';
}
