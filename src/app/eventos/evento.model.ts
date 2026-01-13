export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  imagenPrincipal: string;
  galeria: string[];
  fechaInicio: string; // ISO
  fechaFin: string; // ISO
  inicioPromocion?: string; // ISO
  finPromocion?: string; // ISO
  ubicacion: {
    lat: number;
    lng: number;
    direccion?: string;
  };
  contacto?: string; // telefono o email
  servicios: string[];
  tipo: 'comercial' | 'capacitación' | 'rueda de prensa' | 'talleres' | 'charlas';
  prioridad?: number; // mayor = más prioridad si misma fecha
}
