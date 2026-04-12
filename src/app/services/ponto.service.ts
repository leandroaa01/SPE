import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface HorarioDiaPayload {
    dia: string;
    horariosSelecionados: string[];
    totalHoras: number;
}

export interface MeusHorariosPayload {
    dias: HorarioDiaPayload[];
}

@Injectable({ providedIn: 'root' })
export class PontoService {
    private readonly registrarPontoUrl = 'http://localhost:8080/spe/api/bolsista/registre-ponto';
    private readonly imprimirPontoUrl = 'http://localhost:8080/spe/api/bolsista/imprimir-ponto';
    private readonly meusHorariosUrl = 'http://localhost:8080/spe/api/bolsista/meus-horarios';

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

    salvarMeusHorarios(payload: MeusHorariosPayload): Observable<void> {
        const token = localStorage.getItem('auth_token');
        let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
        if (token) {
            headers = headers.set('Authorization', `Bearer ${token}`);
        }

        return this.http.post<void>(this.meusHorariosUrl, payload, { headers });
    }

    obterMeusHorarios(): Observable<MeusHorariosPayload> {
        const token = localStorage.getItem('auth_token');
        const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
        return this.http.get<MeusHorariosPayload>(this.meusHorariosUrl, { headers });
    }
}
