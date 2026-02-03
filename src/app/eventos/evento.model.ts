// Interfaz que sigue exactamente la estructura y nombres del API
export interface Evento {
  id: number;
  name: string;
  mainBanner?: string;
  type?: string;
  dateStart: string; // ISO date string
  dateEnd: string;   // ISO date string
  description?: string;
  direction?: string;
  location?: string;
  contact?: { type: string; description: string }[];
  services?: string[];
  images?: { name: string; url: string }[];
  link?: string;
  state?: boolean;
  // Campos opcionales usados internamente por la app (no vienen del API normalmente)
  inicioPromocion?: string | Date;
  finPromocion?: string | Date;
  prioridad?: number;
  organizadores?: { nombre: string; avatar?: string }[];
}
