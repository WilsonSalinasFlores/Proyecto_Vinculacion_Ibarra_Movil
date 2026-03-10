import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
   private apiUrl = environment.apiUrl;

  private loginUrl = `${this.apiUrl}/auth/login`;
  private validateEmailUrl = `${this.apiUrl}/recovery/email/validation`;
  private validateOTPUrl = `${this.apiUrl}/recovery/otp/validation`;
  private resetPasswordUrl = `${this.apiUrl}/recovery/password`;
  
  private authState = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.authState.asObservable();

private currentUser = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUser.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuthState();
    this.loadUserData();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  login(email: string, password: string): Observable<any> {
    const payload = {
      username: email,
      password: password
    };
    const headers = this.getHeaders();
    
    return this.http.post<any>(this.loginUrl, payload, { headers }).pipe(
      tap(response => {
        if (response?.jwt) { 
          this.storeAuthData(response);
          this.authState.next(true);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        
        let errorMsg = 'Error desconocido';
        if (error.status === 401) {
          errorMsg = 'Credenciales incorrectas';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        } else if (error.status === 400) {
          errorMsg = 'Solicitud inválida. Verifique los datos.';
        }
        throw new Error(errorMsg);
      })
    );
  }

  validateEmail(email: string): Observable<any> {
    const payload = { email: email };
    const headers = this.getHeaders();
    
    return this.http.post<any>(this.validateEmailUrl, payload, { headers }).pipe(
      tap((response) => {
        // Email validado correctamente
      }),
      catchError(error => {
        console.error('Error al validar email:', error);
        
        let errorMsg = 'Error al validar el correo';
        if (error.status === 404) {
          errorMsg = 'El correo electrónico no está registrado en nuestro sistema';
        } else if (error.status === 400) {
          errorMsg = 'Formato de correo inválido';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

  validateOTP(otp: string, uuid: string): Observable<any> {
    const payload = {
      otp: otp,
      uuid: uuid
    };
    const headers = this.getHeaders();
    
    return this.http.post<any>(this.validateOTPUrl, payload, { headers }).pipe(
      tap((response) => {
        // OTP validado correctamente
      }),
      catchError(error => {
        console.error('Error al validar OTP:', error);
        
        let errorMsg = 'Error al validar el código';
        if (error.status === 400) {
          const backendMsg = error.error?.message || error.error?.error;
          errorMsg = backendMsg || 'Código inválido o expirado';
        } else if (error.status === 404) {
          errorMsg = 'Código no encontrado';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

  resetPassword(userId: any, newPassword: string): Observable<any> {
    const payload = {
      newPassword: newPassword
    };
    const headers = this.getHeaders();
    
    return this.http.put<any>(`${this.resetPasswordUrl}/${userId}`, payload, { headers }).pipe(
      tap(() => {
        // Contraseña actualizada correctamente
      }),
      catchError(error => {
        console.error('Error al cambiar contraseña:', error);
        let errorMsg = 'Error al cambiar la contraseña';
        if (error.status === 400) {
          errorMsg = 'La contraseña no cumple con los requisitos mínimos';
        } else if (error.status === 404) {
          errorMsg = 'Usuario no encontrado o sesión expirada';
        } else if (error.status === 500) {
          errorMsg = 'Error interno del servidor. Intente nuevamente.';
        } else if (error.status === 0) {
          errorMsg = 'No hay conexión con el servidor';
        }
        throw new Error(errorMsg);
      })
    );
  }

private storeAuthData(response: any): void {
    localStorage.setItem('jwt_token', response.jwt);
    
    // Extrae datos del usuario de la respuesta
    const userData = {
      id: response.id,
      name: response.name,
      lastname: response.lastname,
      email: response.email,
      identification: response.identification,
      phone: response.phone,
      address: response.address,
      username: response.username,
      enabled: response.enabled,
      roles: response.roles || []
    };
    
    localStorage.setItem('user_data', JSON.stringify(userData));
    this.currentUser.next(userData);
  }

  private loadUserData(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      this.currentUser.next(JSON.parse(userData));
    }
  }

  getCurrentUser(): any {
    return this.currentUser.value;
  }

  private checkAuthState(): void {
    const isAuthenticated = !!localStorage.getItem('jwt_token');
    this.authState.next(isAuthenticated);
  }

  isAuthenticated(): boolean {
    return this.authState.value;
  }

  logout(): void {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    this.authState.next(false);
    this.router.navigate(['/home']);
  }

  getToken(): string | null {
    return localStorage.getItem('jwt_token');
  }
}