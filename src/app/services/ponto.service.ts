import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PontoService {
    private readonly url = 'http://localhost:8080/spe/api/bolsista/registre-ponto';

    constructor(private http: HttpClient) { }

    registrarPonto(): Observable<string> {
        const token = localStorage.getItem('auth_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.post(this.url, {}, { headers, responseType: 'text' });
    }
}
