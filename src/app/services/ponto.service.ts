import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PontoService {
    private readonly registrarPontoUrl = 'http://localhost:8080/spe/api/bolsista/registre-ponto';
    private readonly imprimirPontoUrl = 'http://localhost:8080/spe/api/bolsista/imprimir-ponto';

    constructor(private http: HttpClient) { }

    registrarPonto(): Observable<string> {
        const token = localStorage.getItem('auth_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.post(this.registrarPontoUrl, {}, { headers, responseType: 'text' });
    }

    imprimirPonto(dataInicio: string, dataFim: string): Observable<Blob> {
        const token = localStorage.getItem('auth_token');
        let headers = new HttpHeaders({ accept: 'application/pdf' });
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.post(
            this.imprimirPontoUrl,
            { dataInicio, dataFim },
            { headers, responseType: 'blob' }
        );
    }
}
