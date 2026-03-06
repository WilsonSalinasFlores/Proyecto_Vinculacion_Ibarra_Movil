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
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    const formatted = schedules.map(schedule => {
      const day = (schedule?.dayOfWeek !== undefined && dayNames[schedule.dayOfWeek]) 
        ? dayNames[schedule.dayOfWeek] 
        : 'Día desconocido';
      const hours = schedule?.isClosed 
        ? 'Cerrado' 
        : `${schedule?.openTime || ''} - ${schedule?.closeTime || ''}`;

      return { day, hours };
    });

    return formatted;
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
