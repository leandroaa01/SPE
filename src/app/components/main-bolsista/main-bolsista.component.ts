import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BolsistaInfo } from './bolsista-info.model';
import { PontoDTO } from './ponto-dto.model';
import { JustificativaDTO } from './justificativa-dto.model';

@Component({
  selector: 'app-main-bolsista',
  standalone: true,
  imports: [RouterLink, HeaderComponent, CommonModule],
  templateUrl: './main-bolsista.component.html',
  styleUrls: ['./main-bolsista.component.scss']
})
export class MainBolsistaComponent implements OnInit {
  bolsistaInfo?: BolsistaInfo;
  pontos: PontoDTO[] = [];
  justificativas: JustificativaDTO[] = [];
  errorMsg?: string;

  justificativaSelecionada?: JustificativaDTO;

  abrirJustificativa(id: number) {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<any>(`http://localhost:8080/spe/api/bolsista/minhas-justificativas/${id}`, { headers })
      .subscribe({
        next: (data) => {
         
          this.justificativaSelecionada = data;
        },
        error: () => {
          this.justificativaSelecionada = undefined;
        }
      });
  }

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<BolsistaInfo>('http://localhost:8080/spe/api/bolsista/me', { headers })
      .subscribe({
        next: (data) => {
          this.bolsistaInfo = data;
          this.errorMsg = undefined;
        },
        error: (err) => {
          this.bolsistaInfo = undefined;
          this.errorMsg = 'Erro ao carregar dados do bolsista.';
        }
      });

    this.http.get<PontoDTO[]>('http://localhost:8080/spe/api/bolsista/meus-pontos', { headers })
      .subscribe({
        next: (data) => {
          this.pontos = data;
        },
        error: () => {
          this.pontos = [];
        }
      });

    this.http.get<JustificativaDTO[]>('http://localhost:8080/spe/api/bolsista/minhas-justificativas', { headers })
      .subscribe({
        next: (data) => {
          //console.log('Justificativas recebidas:', data);
          this.justificativas = Array.isArray(data) ? data : [data];
        },
        error: (err) => {
          // console.error('Erro ao buscar justificativas:', err);
          this.justificativas = [];
        }
      });
  }
}
