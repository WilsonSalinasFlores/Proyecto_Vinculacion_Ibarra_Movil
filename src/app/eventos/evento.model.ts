// Interfaz que sigue exactamente la estructura y nombres del API
export interface Evento {
  id: number;
  name: string;
  
  type?: string;
  dateStart: string; // ISO date string
  dateEnd: string;   // ISO date string
  description?: string;
  direction?: string;
  location?: string;
  contact?: { type: string; description: string }[];
  services?: string[];
  images?: { name: string; url: string }[];
  // Campo histórico/compatibilidad: banner principal que antes se llamaba `mainBanner` en el API
  mainBanner?: string;
  // Campo derivado: url del banner (se extrae de `images` donde name === 'banner')
  banner?: string;
  // Campo derivado: urls de la galería (se extrae de `images` donde name === 'galeria' o 'galery')
  gallery?: string[];
  link?: string;
  state?: boolean;
  // Campos opcionales usados internamente por la app (no vienen del API normalmente)
  inicioPromocion?: string | Date;
  finPromocion?: string | Date;
  prioridad?: number;
  organizadores?: { nombre: string; avatar?: string }[];
}

/**
 * Extrae `banner` y `gallery` a partir del array `images` en el objeto `evento`.
 * - Busca `banner` por nombre exacto (case-insensitive).
 * - Busca entradas de galería con nombre `galeria` o `galery` (case-insensitive).
 * Modifica y devuelve el mismo objeto `evento` para conveniencia.
 */
export function extractMediaFromImages(evento: Evento): Evento {
  if (!evento || !evento.images || !Array.isArray(evento.images)) return evento;

  const images = evento.images;
  const bannerItem = images.find(i => (i.name || '').toLowerCase() === 'banner');
  evento.banner = bannerItem ? bannerItem.url : undefined;

  const galleryNames = new Set(['galeria', 'galery']);
  evento.gallery = images
    .filter(i => galleryNames.has((i.name || '').toLowerCase()))
    .map(i => i.url);

  return evento;
}
