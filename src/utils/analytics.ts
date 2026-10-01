// Analytics helper for @vercel/analytics and custom telemetry
export type OrcamentoOrigem =
  | 'hero'
  | 'header'
  | 'servicos'
  | 'insulfilm'
  | 'cuidados'
  | 'visite'
  | 'barra_mobile';

export type HeroSlideOrigem = 'seta' | 'aba' | 'swipe' | 'teclado' | 'auto';

export function trackHeroSlide(slide: number | string, origem: HeroSlideOrigem): void {
  trackEvent('hero_slide', {
    slide,
    origem,
  });
}

export function trackEvent(name: string, props?: Record<string, unknown>): void {
  try {
    if (typeof window !== 'undefined') {
      // Vercel analytics or custom window event dispatch
      const va = (window as unknown as { va?: (type: string, name: string, props?: Record<string, unknown>) => void }).va;
      if (va) {
        va('event', name, props);
      }
      
      // Dispatch browser custom event for debugging or third-party listeners
      window.dispatchEvent(new CustomEvent('site_analytics', { detail: { name, props } }));
    }
  } catch (err) {
    // Fail silently in production
    console.debug('[Analytics]', name, props);
  }
}

export function trackOrcamento(origem: OrcamentoOrigem, servico?: string): void {
  trackEvent('click_orcamento', {
    origem,
    servico: servico || 'geral',
  });
}

export function trackComoChegar(): void {
  trackEvent('click_como_chegar');
}

export function trackTelefone(): void {
  trackEvent('click_telefone');
}

export function trackInstagram(): void {
  trackEvent('click_instagram');
}

export function trackUsoAntesDepois(): void {
  trackEvent('uso_antes_depois');
}
