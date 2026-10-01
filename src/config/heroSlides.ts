export interface CalloutBrand {
  name: string;
  logoUrl?: string;
}

export interface CalloutConfig {
  point?: { x: number; y: number };
  elbow?: { x: number; y: number }; // Turn point (vertical then horizontal)
  cardEnd?: { x: number; y: number }; // Point where horizontal line reaches the card
  card: { x: number; y: number; width?: number };
  text: string;
  brands?: CalloutBrand[];
  isCentralLogo?: boolean;
}

export interface HeroSlide {
  index: number;
  id: string;
  tabLabel: string;
  counter?: string; // e.g. "01" (null for pose 0)
  title: string;
  subtitle?: string;
  eyebrow?: string;
  description?: string;
  hint?: string;
  benefits?: string[];
  support?: string;
  ctaText: string;
  ctaService?: string;
  showStatus?: boolean;
  callout?: CalloutConfig;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    index: 0,
    id: 'central',
    tabLabel: 'Central',
    eyebrow: 'Alta Floresta · MT · Desde 2017',
    title: 'CENTRAL',
    subtitle: 'Vidros e Acessórios',
    description: 'Peças e serviços automotivos.',
    hint: 'Arraste ou use as setas pra ver os serviços',
    ctaText: 'Fazer orçamento no WhatsApp',
    ctaService: undefined,
    showStatus: true,
    callout: {
      isCentralLogo: true,
      card: { x: 960, y: 80 },
      text: 'Central Vidros e Acessórios',
    },
  },
  {
    index: 1,
    id: 'insulfilm',
    tabLabel: 'Insulfilm',
    counter: '01',
    title: 'INSULFILM',
    benefits: [
      'Reduz o calor',
      'Bloqueia os raios UV',
      'Mais privacidade e conforto',
      'Excelente visibilidade',
    ],
    support: 'Películas 3M e SunTek para veículos, casas e comércios.',
    ctaText: 'Orçamento de insulfilm',
    ctaService: 'insulfilm',
    callout: {
      point: { x: 1230, y: 382 },
      elbow: { x: 1230, y: 170 },
      cardEnd: { x: 1330, y: 170 },
      card: { x: 1330, y: 95, width: 260 },
      text: 'Insulfilm',
      brands: [
        { name: '3M', logoUrl: '/marcas/3m.svg' },
        { name: 'SunTek', logoUrl: '/marcas/suntek.svg' },
      ],
    },
  },
  {
    index: 2,
    id: 'iluminacao',
    tabLabel: 'Iluminação',
    counter: '02',
    title: 'ILUMINAÇÃO',
    benefits: [
      'Faróis e lanternas',
      'Conectores, relés e fusíveis',
      'Polimento de farol',
    ],
    ctaText: 'Orçamento de iluminação',
    ctaService: 'iluminação',
    callout: {
      point: { x: 1170, y: 468 },
      elbow: { x: 1170, y: 170 },
      cardEnd: { x: 1290, y: 170 },
      card: { x: 1290, y: 95, width: 240 },
      text: 'Lanternas e faróis',
    },
  },
  {
    index: 3,
    id: 'acessorios',
    tabLabel: 'Acessórios',
    counter: '03',
    title: 'ACESSÓRIOS',
    benefits: [
      'Volantes',
      'Calotas',
      'Capotas',
      'Instalação profissional',
    ],
    support: 'Variedade e qualidade pra deixar o seu carro mais completo.',
    ctaText: 'Orçamento de acessórios',
    ctaService: 'acessórios',
    callout: {
      point: { x: 878, y: 758 },
      elbow: { x: 878, y: 930 },
      cardEnd: { x: 990, y: 930 },
      card: { x: 990, y: 880, width: 230 },
      text: 'Acessórios',
      brands: [
        { name: 'Grid', logoUrl: '/marcas/grid.svg' },
      ],
    },
  },
  {
    index: 4,
    id: 'som-e-multimidia',
    tabLabel: 'Som e multimídia',
    counter: '04',
    title: 'SOM E MULTIMÍDIA',
    benefits: [
      'Som automotivo',
      'Multimídia',
      'Instalação profissional',
    ],
    ctaText: 'Orçamento de som e multimídia',
    ctaService: 'som e multimídia',
    callout: {
      point: { x: 1035, y: 360 },
      elbow: { x: 1035, y: 160 },
      cardEnd: { x: 1150, y: 160 },
      card: { x: 1150, y: 85, width: 250 },
      text: 'Som e multimídia',
      brands: [
        { name: 'Roadstar', logoUrl: '/marcas/roadstar.svg' },
      ],
    },
  },
  {
    index: 5,
    id: 'vidros-e-parabrisa',
    tabLabel: 'Vidros e para-brisa',
    counter: '05',
    title: 'VIDROS E PARA-BRISA',
    benefits: [
      'Troca de vidros e para-brisa',
      'Avaliação e manutenção de vedações',
      'Interior livre de poeira',
    ],
    ctaText: 'Orçamento de vidros',
    ctaService: 'vidros e para-brisa',
    callout: {
      point: { x: 920, y: 350 },
      elbow: { x: 920, y: 150 },
      cardEnd: { x: 1060, y: 150 },
      card: { x: 1060, y: 75, width: 250 },
      text: 'Vidros e para-brisa',
    },
  },
];
