import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RegistroAppService {
   private apiUrl = 'https://advice-reseller-tournament-mitchell.trycloudflare.com'; // environment.apiUrl;
   private registroUrl = `${this.apiUrl}/users/register`;


  constructor(private http: HttpClient) { }

  post(request: any): Observable<any> {
    return this.http.post<any>(this.registroUrl, request)
    .pipe()
  }
 
}