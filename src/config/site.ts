export const SITE_URL = "https://central-vidros-kappa.vercel.app";
export const INDEXAR = true;
export const WHATSAPP_NUMBER = "556635213804";
export const PHONE_DISPLAY = "(66) 3521-3804";
export const PHONE_TEL = "+556635213804";
export const INSTAGRAM_URL = "https://www.instagram.com/centralacessorios.af";
export const INSTAGRAM_HANDLE = "@centralacessorios.af";
export const EMAIL = "centralacessorios.af@gmail.com";
export const ADDRESS = "Av. Perimetral, 2099 · Setor Ap-F2 · Alta Floresta - MT";
export const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Central+Vidros+e+Acessorios+Av+Perimetral+2099+Alta+Floresta+MT";
export const GOOGLE_REVIEWS_URL = "[LINK DAS AVALIAÇÕES NO GOOGLE]";
export const CNPJ = "28.963.747/0001-64";
export const HOURS = "seg–sex 07:00–18:00 · sáb 07:00–12:00 · dom fechado";
export const MOSTRAR_JULIO = true;

export function waLink(servico?: string): string {
  const text = servico
    ? `Olá! Vim pelo site e quero um orçamento de ${servico}.`
    : "Olá! Vim pelo site e quero fazer um orçamento.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

export const SHARE_MESSAGE = `Central Vidros e Acessórios, peças e serviços automotivos em Alta Floresta: ${SITE_URL}`;
