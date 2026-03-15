import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface BusinessCategory {
  id: number;
  name: string;
  description: string | null;
}
export interface BussinessPhoto{
  id: number;
  url: string;
  fileType: string;
  publicId: string | null;
  photoType: string;
}

export interface Business {
  id: number;
  commercialName: string;
  representativeName?: string | null;
  description: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  website: string;
  address: string;
  parishCommunitySector: string;
  googleMapsCoordinates: string;
  logoUrl: string | null;
  photos: BussinessPhoto[];
  schedules: any[];
  acceptsWhatsappOrders: boolean;
  deliveryService: string;
  salePlace: string;
  category: BusinessCategory;
}

export interface BusinessResponse {
  success: boolean;
  message: string;
  data: {
    page: number;
    content: Business[];
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DetallePublicoService {
  private apiUrl = environment.apiUrl;
  private businessUrl = `${this.apiUrl}/business`;

  constructor(private http: HttpClient) {}

  getApprovedBusinesses(page: number = 0, size: number = 10): Observable<BusinessResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const url = `${this.businessUrl}/public/approved`;

    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          
          // Procesar cada negocio para extraer logos
          const processedContent = (response.data?.content || response.content || []).map((business: any) => ({
            ...business,
            logoUrl: this.extractLogoUrl(business.photos || []),
            // Asegurar valores por defecto
            email: business.email || '',
            whatsappNumber: business.whatsappNumber || '',
            photos: business.photos || []
          }));
          
          return {
            ...response,
            data: {
              ...(response.data || response),
              content: processedContent
            }
          };
        }),
        catchError((error) => {
          console.error('=== API ERROR IN SERVICE ===');
          console.error('Error object:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para endpoint específico público
  getBusinessByIdPublic(id: number): Observable<Business> {
    const url = `${this.businessUrl}/public-details`;
    const params = new HttpParams().set('id', id.toString());

    return this.http.get<any>(url, { params })
      .pipe(
        map(response => {
          // Procesar la respuesta para extraer el logo y formatear las fotos
          const processedBusiness = this.processBusinessResponse(response);

          return processedBusiness;
        }),
        catchError((error) => {
          console.error('=== API ERROR ===');
          console.error('Error:', error);
          return throwError(() => new Error(this.getErrorMessage(error)));
        })
      );
  }

  // Método para procesar la respuesta de la API
  private processBusinessResponse(response: any): Business {
    // Extraer el logo URL de las fotos
    const logoUrl = this.extractLogoUrl(response.photos || []);
    
    return {
      ...response,
      logoUrl: logoUrl,
      // Asegurar que las propiedades opcionales tengan valores por defecto
      email: response.email || '',
      whatsappNumber: response.whatsappNumber || '',
      facebook: response.facebook || '',
      instagram: response.instagram || '',
      tiktok: response.tiktok || '',
      website: response.website || '',
      address: response.address || '',
      parishCommunitySector: response.parishCommunitySector || '',
      // Mantener el array de fotos como objetos
      photos: response.photos || [],
      // Valores por defecto para otras propiedades
      representativeName: response.representativeName || null,
      description: response.description || '',
      phone: response.phone || '',
      googleMapsCoordinates: response.googleMapsCoordinates || '',
      acceptsWhatsappOrders: response.acceptsWhatsappOrders || false,
      deliveryService: response.deliveryService || 'NO',
      salePlace: response.salePlace || 'NO',
      category: response.category || { id: 0, name: '', description: null }
    };
  }

  // Método para extraer el logo URL del array de fotos
  private extractLogoUrl(photos: BussinessPhoto[]): string {
    if (!photos || photos.length === 0) {
      return 'assets/icon/ibarra.jpg';
    }
    
    // Buscar la foto con photoType = 'LOGO'
    const logo = photos.find(photo => photo.photoType === 'LOGO');
    if (logo) {
      return logo.url;
    }
    
    // Si no hay logo, usar la primera imagen disponible
    return photos[0].url || 'assets/icon/ibarra.jpg';
  }

  // Método para obtener solo las URLs de las fotos (para el carrusel)
  getPhotoUrls(photos: BussinessPhoto[]): string[] {
    if (!photos || photos.length === 0) {
      return [];
    }
    return photos.map(photo => photo.url);
  }

  // Método para formatear horarios
  formatSchedules(schedules: any[]): { day: string, hours: string }[] {
    if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
      return [];
    }

    return schedules
      .map((schedule: any) => this.normalizeSchedule(schedule))
      .filter((item): item is { day: string; hours: string } => !!item);
  }

  private normalizeSchedule(schedule: any): { day: string; hours: string } | null {
    if (typeof schedule === 'string') {
      return this.parseStringSchedule(schedule);
    }

    if (!schedule || typeof schedule !== 'object') {
      return null;
    }

    const day = this.translateDay(String(schedule.dayOfWeek ?? schedule.day ?? schedule.dayName ?? ''));
    const isClosed = this.toBoolean(schedule.isClosed ?? schedule.closed);
    const openTime = this.normalizeTime(schedule.openTime ?? schedule.startTime ?? schedule.openingTime);
    const closeTime = this.normalizeTime(schedule.closeTime ?? schedule.endTime ?? schedule.closingTime);

    const hours = isClosed
      ? 'Cerrado'
      : (openTime && closeTime ? `${openTime} - ${closeTime}` : (schedule.hours ? String(schedule.hours) : 'No definido'));

    return {
      day,
      hours: hours === 'CLOSED' ? 'Cerrado' : hours
    };
  }

  private parseStringSchedule(rawSchedule: string): { day: string; hours: string } | null {
    const value = String(rawSchedule || '').trim();
    if (!value) return null;

    const dayRangeMatch = value.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ.]+)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ.]+)\s*-\s*(.+)$/i);
    if (dayRangeMatch) {
      const fromDay = this.translateDay(dayRangeMatch[1]);
      const toDay = this.translateDay(dayRangeMatch[2]);
      const hoursValue = this.formatHours(dayRangeMatch[3]) || 'No definido';
      return { day: `${fromDay} a ${toDay}`, hours: hoursValue };
    }

    const parts = value.split(/\s+/);
    const day = this.translateDay(parts[0] || '');
    const rawHours = parts.slice(1).join(' ').trim();
    const upperHours = rawHours.toUpperCase();
    const hours = (upperHours === 'CLOSED' || upperHours === 'CERRADO')
      ? 'Cerrado'
      : (this.formatHours(rawHours) || 'No definido');

    return { day, hours };
  }

  private translateDay(day: string): string {
    const numericDay = Number(day);
    if (Number.isFinite(numericDay)) {
      const sundayFirst = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const mondayFirst = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      if (numericDay >= 0 && numericDay <= 6) return sundayFirst[numericDay];
      if (numericDay >= 1 && numericDay <= 7) return mondayFirst[numericDay - 1];
    }

    const normalizedDay = this.normalizeDayKey(day);
    const days: { [key: string]: string } = {
      MONDAY: 'Lunes',
      LUNES: 'Lunes',
      MON: 'Lunes',
      LUN: 'Lunes',
      TUESDAY: 'Martes',
      MARTES: 'Martes',
      TUE: 'Martes',
      MAR: 'Martes',
      WEDNESDAY: 'Miércoles',
      MIERCOLES: 'Miércoles',
      WED: 'Miércoles',
      MIE: 'Miércoles',
      THURSDAY: 'Jueves',
      JUEVES: 'Jueves',
      THU: 'Jueves',
      JUE: 'Jueves',
      FRIDAY: 'Viernes',
      VIERNES: 'Viernes',
      FRI: 'Viernes',
      VIE: 'Viernes',
      SATURDAY: 'Sábado',
      SABADO: 'Sábado',
      SAT: 'Sábado',
      SAB: 'Sábado',
      SUNDAY: 'Domingo',
      DOMINGO: 'Domingo',
      SUN: 'Domingo',
      DOM: 'Domingo'
    };
    return days[normalizedDay] || 'Día desconocido';
  }

  private formatHours(hours: string): string {
    const value = String(hours || '').trim();
    if (!value) return '';

    if (value.includes('-')) {
      const [start, end] = value.split('-');
      return `${this.normalizeTime(start)} - ${this.normalizeTime(end)}`;
    }

    return value;
  }

  private normalizeTime(value: any): string {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text) return '';
    return text.length >= 5 ? text.slice(0, 5) : text;
  }

  private normalizeDayKey(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return ['true', '1', 'si', 'sí', 'yes'].includes(value.toLowerCase());
    if (typeof value === 'number') return value === 1;
    return false;
  }

  // Método para obtener coordenadas como array
  getCoordinatesArray(coordinates: string): [number, number] {
    if (!coordinates) {
      return [0, 0];
    }
    
    const coords = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return coords.length === 2 ? [coords[0], coords[1]] : [0, 0];
  }

  private getErrorMessage(error: any): string {
    if (error.status === 404) {
      return 'No se encontraron negocios.';
    } else if (error.status === 0) {
      return 'No hay conexión con el servidor.';
    } else if (error.status >= 500) {
      return 'Error interno del servidor.';
    }
    return 'Ocurrió un error al obtener los datos.';
  }
}