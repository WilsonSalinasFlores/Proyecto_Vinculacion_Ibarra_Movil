import { Injectable } from '@angular/core';
import { Evento } from './evento.model';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private eventos: Evento[] = [];

  constructor() {
    this.eventos = this.crearDatosFicticios();
  }

  /**
   * Carga eventos desde el JSON del API y los mapea al modelo interno.
   * Puede ser llamado pasando el objeto JSON que contiene `data: ApiEvento[]`.
   */
  cargarDesdeApi(json: { success: boolean; message?: string; data: Evento[] } | null) {
    if (!json || !Array.isArray(json.data)) return;
    // Asumimos que la estructura ya coincide con `Evento` (nombres del API)
    this.eventos = json.data.slice();
  }

  private crearDatosFicticios(): Evento[] {
    const hoy = new Date();
    // Datos de ejemplo usando la estructura del API (nombres idénticos)
    const datos: Evento[] = [
      {
        id: 1,
        name: 'Feria Comercial Ibarra 2026',
        description: 'Gran feria con productores locales, ventas y actividades culturales.',
        mainBanner: 'https://picsum.photos/seed/feria/800/450',
        galery: ['https://picsum.photos/seed/feria1/1200/800','https://picsum.photos/seed/feria2/1200/800','https://picsum.photos/seed/feria3/1200/800'],
        dateStart: new Date(hoy.getTime() + 2 * 24*60*60*1000).toISOString(),
        dateEnd: new Date(hoy.getTime() + 3 * 24*60*60*1000).toISOString(),
        direction: 'Parque Pedro Moncayo, Ibarra',
        location: 'Ibarra',
        contact: [{ type: 'telefono', description: '+5930999999999' }],
        services: ['Comercio', 'Alimentos', 'Entretenimiento'],
        type: 'comercial',
        state: true
      },
      {
        id: 2,
        name: 'Capacitación en Emprendimiento',
        description: 'Curso intensivo para emprendedores del cantón Ibarra.',
        mainBanner: 'https://picsum.photos/seed/capacitacion/800/450',
        galery: ['https://picsum.photos/seed/cap1/1200/800','https://picsum.photos/seed/cap2/1200/800'],
        dateStart: new Date(hoy.getTime() + 5 * 24*60*60*1000).toISOString(),
        dateEnd: new Date(hoy.getTime() + 5 * 24*60*60*1000).toISOString(),
        direction: 'Centro de Convenciones Ibarra',
        location: 'Ibarra',
        contact: [{ type: 'telefono', description: '+5930988888888' }],
        services: ['Formación', 'Networking'],
        type: 'capacitación',
        state: true
      },
      {
        id: 3,
        name: 'Capacitación en Emprendimiento Enero',
        description: 'Curso intensivo para emprendedores del cantón Ibarra.',
        mainBanner: 'https://picsum.photos/seed/capacitacion/800/450',
        galery: ['https://picsum.photos/seed/cap1/1200/800','https://picsum.photos/seed/cap2/1200/800'],
        dateStart: new Date(hoy.getTime() - 10 * 24*60*60*1000).toISOString(),
        dateEnd: new Date(hoy.getTime() + 5 * 24*60*60*1000).toISOString(),
        direction: 'Centro de Convenciones Ibarra',
        location: 'Ibarra',
        contact: [{ type: 'telefono', description: '+5930988888888' }],
        services: ['Formación', 'Networking'],
        type: 'capacitación',
        state: true
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
      const da = Math.abs(new Date(a.dateStart).getTime() - ahora);
      const db = Math.abs(new Date(b.dateStart).getTime() - ahora);
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
    const orden = this.eventos.slice().sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
    return orden.slice(desdeIndex, desdeIndex + cantidad);
  }

  cargarAnteriores(hastaIndex: number, cantidad = 5): Evento[] {
    const orden = this.eventos.slice().sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
    const start = Math.max(0, hastaIndex - cantidad);
    return orden.slice(start, hastaIndex);
  }
}
