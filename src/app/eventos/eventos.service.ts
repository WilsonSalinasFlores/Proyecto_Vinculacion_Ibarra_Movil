import { Injectable } from '@angular/core';
import { Evento } from './evento.model';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private eventos: Evento[] = [];

  constructor() {
    this.eventos = this.crearDatosFicticios();
  }

  private crearDatosFicticios(): Evento[] {
    const hoy = new Date();
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 24 * 60 * 60 * 1000);

    const datos: Evento[] = [
      {
        id: 'e1',
        titulo: 'Feria Comercial Ibarra 2026',
        descripcion: 'Gran feria con productores locales, ventas y actividades culturales.',
        imagenPrincipal: 'https://picsum.photos/seed/feria/800/450',
        galeria: ['https://picsum.photos/seed/feria1/1200/800','https://picsum.photos/seed/feria2/1200/800','https://picsum.photos/seed/feria3/1200/800'],
        fechaInicio: addDays(hoy, 2),
        fechaFin: addDays(hoy, 3),
        inicioPromocion: addDays(hoy, -5),
        finPromocion: addDays(hoy, 1),
        ubicacion: { lat: -0.3397, lng: -78.1276, direccion: 'Parque Pedro Moncayo, Ibarra' },
        contacto: '+5930999999999',
        servicios: ['Comercio', 'Alimentos', 'Entretenimiento'],
        tipo: 'comercial',
        prioridad: 1
      },
      {
        id: 'e2',
        titulo: 'Capacitación en Emprendimiento',
        descripcion: 'Curso intensivo para emprendedores del cantón Ibarra.',
        imagenPrincipal: 'https://picsum.photos/seed/capacitacion/800/450',
        galeria: ['https://picsum.photos/seed/cap1/1200/800','https://picsum.photos/seed/cap2/1200/800'],
        fechaInicio: addDays(hoy, 5),
        fechaFin: addDays(hoy, 5),
        inicioPromocion: addDays(hoy, -2),
        finPromocion: addDays(hoy, 4),
        ubicacion: { lat: -0.3412, lng: -78.1260, direccion: 'Centro de Convenciones Ibarra' },
        contacto: '+5930988888888',
        servicios: ['Formación', 'Networking'],
        tipo: 'capacitación',
        prioridad: 2
      },
      {
        id: 'e3',
        titulo: 'Rueda de prensa Municipalidad',
        descripcion: 'Presentación de nuevas obras y proyectos municipales.',
        imagenPrincipal: 'https://picsum.photos/seed/rueda/800/450',
        galeria: ['https://picsum.photos/seed/rueda1/1200/800'],
        fechaInicio: addDays(hoy, -1),
        fechaFin: addDays(hoy, -1),
        inicioPromocion: addDays(hoy, -10),
        finPromocion: addDays(hoy, -2),
        ubicacion: { lat: -0.3385, lng: -78.1290, direccion: 'Sala Municipal Ibarra' },
        contacto: '+5930987777777',
        servicios: ['Información pública'],
        tipo: 'rueda de prensa',
        prioridad: 1
      },
      {
        id: 'e4',
        titulo: 'Taller de Artesanía',
        descripcion: 'Taller práctico para aprender técnicas tradicionales.',
        imagenPrincipal: 'https://picsum.photos/seed/taller/800/450',
        galeria: ['https://picsum.photos/seed/taller1/1200/800','https://picsum.photos/seed/taller2/1200/800'],
        fechaInicio: addDays(hoy, 10),
        fechaFin: addDays(hoy, 11),
        inicioPromocion: addDays(hoy, 0),
        finPromocion: addDays(hoy, 9),
        ubicacion: { lat: -0.3360, lng: -78.1250, direccion: 'Casa de la Cultura Ibarra' },
        contacto: '+5930986666666',
        servicios: ['Formación', 'Materiales'],
        tipo: 'talleres'
      },
      {
        id: 'e5',
        titulo: 'Charlas de Salud Pública',
        descripcion: 'Charlas informativas sobre prevención y cuidado.',
        imagenPrincipal: 'https://picsum.photos/seed/charla/800/450',
        galeria: ['https://picsum.photos/seed/charla1/1200/800'],
        fechaInicio: addDays(hoy, 1),
        fechaFin: addDays(hoy, 1),
        inicioPromocion: addDays(hoy, -3),
        finPromocion: addDays(hoy, 1),
        ubicacion: { lat: -0.3390, lng: -78.1280, direccion: 'Hospital San Vicente, Ibarra' },
        contacto: '+5930985555555',
        servicios: ['Salud', 'Información'],
        tipo: 'charlas'
      },
      {
        id: 'e6',
        titulo: 'Mercado de Agricultores',
        descripcion: 'Productos orgánicos y frescos de la región.',
        imagenPrincipal: 'https://picsum.photos/seed/mercado/800/450',
        galeria: ['https://picsum.photos/seed/mercado1/1200/800'],
        fechaInicio: addDays(hoy, -7),
        fechaFin: addDays(hoy, -7),
        inicioPromocion: addDays(hoy, -20),
        finPromocion: addDays(hoy, -8),
        ubicacion: { lat: -0.3420, lng: -78.1300, direccion: 'Plaza de los Ponchos' },
        contacto: '+5930984444444',
        servicios: ['Venta', 'Degustación'],
        tipo: 'comercial'
      }
    ];

    return datos;
  }

  listarEventos(): Evento[] {
    return this.eventos.slice();
  }

  obtenerMasCercanos(n = 5): Evento[] {
    const ahora = new Date().getTime();
    const copia = this.eventos.slice();
    copia.sort((a, b) => {
      const da = Math.abs(new Date(a.fechaInicio).getTime() - ahora);
      const db = Math.abs(new Date(b.fechaInicio).getTime() - ahora);
      if (da === db) {
        const pa = a.prioridad || 0;
        const pb = b.prioridad || 0;
        return pb - pa;
      }
      return da - db;
    });
    return copia.slice(0, n);
  }

  cargarNuevos(desdeIndex: number, cantidad = 5): Evento[] {
    const orden = this.eventos.slice().sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    return orden.slice(desdeIndex, desdeIndex + cantidad);
  }

  cargarAnteriores(hastaIndex: number, cantidad = 5): Evento[] {
    const orden = this.eventos.slice().sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    const start = Math.max(0, hastaIndex - cantidad);
    return orden.slice(start, hastaIndex);
  }
}
