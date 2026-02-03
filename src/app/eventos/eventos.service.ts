import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Evento } from './evento.model';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class EventosService {
  private eventos: Evento[] = [];

  constructor(private http: HttpClient) {
    this.eventos = this.crearDatosFicticios();
  }
  private apiUrl = environment.apiUrl;
  /**
   * Carga eventos desde el JSON del API y los mapea al modelo interno.
   * Puede ser llamado pasando el objeto JSON que contiene `data: ApiEvento[]`.
   */
  cargarDesdeApi(json: { success: boolean; message?: string; data: Evento[] } | null) {
    if (!json || !Array.isArray(json.data)) return;
    // Asumimos que la estructura ya coincide con `Evento` (nombres del API)
    this.eventos = json.data.slice();
  }

  /**
   * Carga eventos desde una URL base del API. Construye la ruta `/events` y hace GET.
   * Devuelve el arreglo de eventos cargados o null en caso de error.
   */
  async cargarDesdeApiUrl(): Promise<Evento[] | null> {
    
    const url = this.apiUrl + '/events';
    try {
      const res = await firstValueFrom(this.http.get<{ success: boolean; message?: string; data: Evento[] }>(url));
      if (res && Array.isArray(res.data)) {
        this.eventos = res.data.slice();
        return this.eventos;
      }
      console.warn('Respuesta inválida al cargar eventos desde API', res);
      return null;
    } catch (err) {
      console.error('Error cargando eventos desde API:', err);
      return null;
    }
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
        images: [
          { name: 'feria1.png', url: 'https://picsum.photos/seed/feria1/1200/800' },
          { name: 'feria2.png', url: 'https://picsum.photos/seed/feria2/1200/800' },
          { name: 'feria3.png', url: 'https://picsum.photos/seed/feria3/1200/800' }
        ],
        dateStart: new Date(hoy.getTime() + 2 * 24*60*60*1000).toISOString(),
        dateEnd: new Date(hoy.getTime() + 3 * 24*60*60*1000).toISOString(),
        direction: 'Parque Pedro Moncayo, Ibarra',
        location: 'Ibarra',
        contact: [{ type: 'telefono', description: '+5930999999999' }],
        services: ['Comercio', 'Alimentos', 'Entretenimiento'],
        type: 'comercial',
        state: true,
        link: 'https://gadibarra.gob.ec/feria-comercial-2026'
      },
      {
        id: 2,
        name: 'Capacitación en Emprendimiento',
        description: 'Curso intensivo para emprendedores del cantón Ibarra.',
//        mainBanner: 'https://picsum.photos/seed/capacitacion/800/450',
        images: [
          { name: 'cap1.png', url: 'https://picsum.photos/seed/cap1/1200/800' },
          { name: 'cap2.png', url: 'https://picsum.photos/seed/cap2/1200/800' }
        ],
        dateStart: new Date(hoy.getTime() + 5 * 24*60*60*1000).toISOString(),
        dateEnd: new Date(hoy.getTime() + 5 * 24*60*60*1000).toISOString(),
        direction: 'Centro de Convenciones Ibarra',
        location: 'Ibarra',
        contact: [{ type: 'telefono', description: '+5930988888888' }],
        services: ['Formación', 'Networking'],
        type: 'capacitación',
        state: true,
        link: 'https://gadibarra.gob.ec/capacitacion-emprendimiento'
      },
      {
        id: 3,
        name: 'Capacitación en Emprendimiento Enero',
        description: 'Curso intensivo para emprendedores del cantón Ibarra.',
        mainBanner: 'https://picsum.photos/seed/capacitacion/800/450',
        images: [
          { name: 'cap1.png', url: 'https://picsum.photos/seed/cap1/1200/800' },
          { name: 'cap2.png', url: 'https://picsum.photos/seed/cap2/1200/800' }
        ],
        dateStart: new Date(hoy.getTime() - 10 * 24*60*60*1000).toISOString(),
        dateEnd: new Date(hoy.getTime() + 5 * 24*60*60*1000).toISOString(),
        direction: 'Centro de Convenciones Ibarra',
        location: 'Ibarra',
        contact: [
          { type: 'telefono', description: '+5930988888888' },
          { type: 'whatsapp', description: '+5930988888888' },
          { type: 'email', description: 'wilson-ivan-salinas@hotmail.com' }
        ],
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

}
