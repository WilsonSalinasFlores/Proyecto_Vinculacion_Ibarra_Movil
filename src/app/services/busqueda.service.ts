import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {
  private apiUrl = 'https://advice-reseller-tournament-mitchell.trycloudflare.com'; // environment.apiUrl;

  constructor(private http: HttpClient) { }

  buscarNegocios(searchTerm: string, page: number = 0, size: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('searchTerm', searchTerm.trim());
    }

    return this.http.get<any>(`${this.apiUrl}/business/search`, { params });
  }
}