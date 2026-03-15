import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Business {
  id: number;
  commercialName: string;
  representativeName?: string;
  description: string;
  category?: {
    id: string;
    name: string;
  };
  parish?: {
    id: number;
    name: string;
    type: string;
  };
  logoUrl?: string;
  address: string;
  parishCommunitySector?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
  deliveryService?: string;
  salePlace?: string;
  acceptsWhatsappOrders?: boolean;
  receivedUdelSupport?: boolean;
  udelSupportDetails?: string;
  productsServices?: string;
  validationStatus: string;
  registrationDate: string;
  googleMapsCoordinates?: string;
  schedules?: any[];
  photos?: any[];
  user?: {
    id: number;
    name: string;
    email?: string;
  };
  rejectionReason?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    content: Business[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DetallePrivadoService {
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('jwt_token');

    if (!token) {
      throw new Error('No authentication token available');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // SOLO MÉTODOS DE LECTURA - NO HAY FUNCIONALIDAD DE EDICIÓN

  /**
   * Obtiene lista de negocios privados del usuario autenticado
   */
  getPrivateBusinesses(category: string = '', page: number = 0, size: number = 10): Observable<ApiResponse> {
    const params: any = {
      page: page.toString(),
      size: size.toString()
    };

    if (category && category.trim() !== '') {
      params.category = category;
    }

    return this.http.get<ApiResponse>(`${this.apiUrl}/business/private-list-by-category`, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtiene detalles de un negocio específico del usuario
   */
  getBusinessDetails(businessId: number): Observable<Business> {
    if (!businessId || businessId <= 0) {
      return throwError(() => new Error('Invalid business ID'));
    }

    return this.getPrivateBusinesses('', 0, 100).pipe(
      map(response => {
        if (response.success && response.data && response.data.content && Array.isArray(response.data.content)) {
          const business = response.data.content.find(b => b.id === businessId);
          
          if (!business) {
            console.error('Business not found in private list. Available IDs:', response.data.content.map(b => b.id));
            throw new Error('Negocio no encontrado en tu lista de negocios');
          }

          return business;
        } else {
          console.error('Invalid response structure:', response);
          throw new Error('No se pudieron cargar tus negocios privados');
        }
      }),
      catchError((error) => {
        console.error('Error in getBusinessDetails:', error);
        
        if (error.message && error.message.includes('no encontrado')) {
          return throwError(() => error);
        }

        return this.getBusinessDetailsAlternative(businessId);
      })
    );
  }

  /**
   * Método alternativo para obtener detalles del negocio
   */
  getBusinessDetailsAlternative(businessId: number): Observable<Business> {
    const url = `${this.apiUrl}/business/public-details`;
    const params = { id: businessId.toString() };
    
    return this.http.get<Business>(url, {
      headers: this.getAuthHeaders(),
      params
    }).pipe(
      catchError((error) => {
        console.error('Alternative method also failed:', error);
        
        let errorMessage = 'No se pudieron cargar los detalles del negocio';
        
        if (error.status === 403) {
          errorMessage = 'No tienes permisos para ver este negocio';
        } else if (error.status === 404) {
          errorMessage = 'El negocio no existe o ha sido eliminado';
        } else if (error.status === 401) {
          errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
        }
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Obtiene categorías disponibles (solo lectura)
   */
  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/businessCategories/select`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // MÉTODOS DE UTILIDAD PARA PROCESAMIENTO DE DATOS

  /**
   * Extrae URLs de fotos del negocio
   */
  getPhotoUrls(photos: any[]): string[] {
    if (!photos || !Array.isArray(photos)) {
      return [];
    }
    
    const urls: string[] = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      
      let url = '';
      
      if (typeof photo === 'string' && photo.startsWith('http')) {
        url = photo;
      } else if (typeof photo === 'object' && photo !== null) {
        url = photo.url || 
              photo.photoUrl || 
              photo.imageUrl || 
              photo.src || 
              photo.path || 
              photo.link ||
              photo.href ||
              '';
              
        if (!url && photo.image) {
          url = photo.image.url || photo.image.src || '';
        }
        
        if (!url && photo.metadata) {
          url = photo.metadata.url || photo.metadata.src || '';
        }
      }
      
      if (url && 
          typeof url === 'string' && 
          url.trim() !== '' && 
          (url.startsWith('http://') || url.startsWith('https://'))) {
        
        urls.push(url.trim());
      }
    }

    return urls;
  }

  /**
   * Obtiene solo fotos del carrusel (excluye LOGO y PROMOTION)
   */
  getBusinessCarouselPhotoUrls(photos: any[]): string[] {
    if (!photos || !Array.isArray(photos)) return [];

    const filtered = photos.filter((p: any) => {
      const type = typeof p === 'object' && p ? String(p.photoType || '').toUpperCase() : '';
      return type !== 'LOGO' && type !== 'PROMOTION';
    });

    return this.getPhotoUrls(filtered);
  }

  /**
   * Procesa coordenadas de Google Maps
   */
  getCoordinatesArray(coordinates: string): number[] {
    if (!coordinates) {
      return [0, 0];
    }
    
    const coords = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return coords.length === 2 ? coords : [0, 0];
  }

  /**
   * Formatea horarios de atención
   */
  formatSchedules(schedules: any[]): { day: string, hours: string }[] {
    if (!schedules || !Array.isArray(schedules)) {
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

    const dayValue = schedule.dayOfWeek ?? schedule.day ?? schedule.dayName;
    const day = this.resolveDayLabel(dayValue);

    const isClosed = this.toBoolean(schedule.isClosed ?? schedule.closed);
    const openTime = this.normalizeTime(schedule.openTime ?? schedule.startTime ?? schedule.openingTime);
    const closeTime = this.normalizeTime(schedule.closeTime ?? schedule.endTime ?? schedule.closingTime);

    const hours = isClosed
      ? 'Cerrado'
      : (openTime && closeTime ? `${openTime} - ${closeTime}` : (schedule.hours ? String(schedule.hours) : 'No definido'));

    return { day, hours };
  }

  private parseStringSchedule(rawSchedule: string): { day: string; hours: string } | null {
    const value = String(rawSchedule || '').trim();
    if (!value) return null;

    const dayRangeMatch = value.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ.]+)\s+a\s+([A-Za-zÁÉÍÓÚáéíóúÑñ.]+)\s*-\s*(.+)$/i);
    if (dayRangeMatch) {
      const fromDay = this.resolveDayLabel(dayRangeMatch[1]);
      const toDay = this.resolveDayLabel(dayRangeMatch[2]);
      const hoursValue = this.formatHours(dayRangeMatch[3]) || 'No definido';
      return { day: `${fromDay} a ${toDay}`, hours: hoursValue };
    }

    const parts = value.split(/\s+/);
    const dayRaw = parts[0] || '';
    const rest = parts.slice(1).join(' ').trim();

    const day = this.resolveDayLabel(dayRaw);
    const upperRest = rest.toUpperCase();
    const isClosed = upperRest === 'CLOSED' || upperRest === 'CERRADO';
    const hours = isClosed ? 'Cerrado' : (this.formatHours(rest) || 'No definido');

    return { day, hours };
  }

  private resolveDayLabel(dayValue: any): string {
    if (typeof dayValue === 'number' && Number.isFinite(dayValue)) {
      const sundayFirst = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const mondayFirst = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

      if (dayValue >= 0 && dayValue <= 6) return sundayFirst[dayValue];
      if (dayValue >= 1 && dayValue <= 7) return mondayFirst[dayValue - 1];
    }

    const normalized = this.normalizeDayKey(String(dayValue || ''));
    const map: { [key: string]: string } = {
      MONDAY: 'Lunes', LUNES: 'Lunes',
      MON: 'Lunes', LUN: 'Lunes',
      TUESDAY: 'Martes', MARTES: 'Martes',
      TUE: 'Martes', MAR: 'Martes',
      WEDNESDAY: 'Miércoles', MIERCOLES: 'Miércoles',
      WED: 'Miércoles', MIE: 'Miércoles',
      THURSDAY: 'Jueves', JUEVES: 'Jueves',
      THU: 'Jueves', JUE: 'Jueves',
      FRIDAY: 'Viernes', VIERNES: 'Viernes',
      FRI: 'Viernes', VIE: 'Viernes',
      SATURDAY: 'Sábado', SABADO: 'Sábado',
      SAT: 'Sábado', SAB: 'Sábado',
      SUNDAY: 'Domingo', DOMINGO: 'Domingo'
      ,SUN: 'Domingo', DOM: 'Domingo'
    };

    return map[normalized] || 'Día desconocido';
  }

  private normalizeDayKey(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  private normalizeTime(value: any): string {
    if (value === null || value === undefined) return '';
    const text = String(value).trim();
    if (!text) return '';
    return text.length >= 5 ? text.slice(0, 5) : text;
  }

  private formatHours(value: string): string {
    const text = String(value || '').trim();
    if (!text) return '';

    if (text.includes('-')) {
      const [start, end] = text.split('-');
      return `${this.normalizeTime(start)} - ${this.normalizeTime(end)}`;
    }

    return text;
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return ['true', '1', 'si', 'sí', 'yes'].includes(value.toLowerCase());
    if (typeof value === 'number') return value === 1;
    return false;
  }

  /**
   * Valida formato de coordenadas (solo para verificación)
   */
  isValidCoordinates(coordinates: string): boolean {
    if (!coordinates) return false;

    const coordRegex = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    if (!coordRegex.test(coordinates)) return false;

    const [lat, lng] = coordinates.split(',').map(coord => parseFloat(coord.trim()));
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Valida formato de email (solo para verificación)
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de teléfono ecuatoriano (solo para verificación)
   */
  isValidEcuadorianPhone(phone: string): boolean {
    if (phone.length !== 9) return false;
    const firstDigit = phone.charAt(0);
    return ['2', '3', '4', '5', '6', '7', '9'].includes(firstDigit);
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('HTTP Error occurred:', error);
    
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 401:
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
          localStorage.removeItem('jwt_token');
          break;
        case 403:
          errorMessage = 'No tienes permisos para acceder a este recurso.';
          break;
        case 404:
          errorMessage = 'El recurso solicitado no fue encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Inténtalo más tarde.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
