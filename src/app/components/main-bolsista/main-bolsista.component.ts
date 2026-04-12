import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../header/header.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BolsistaInfo } from './bolsista-info.model';
import { PontoDTO } from './ponto-dto.model';
import { JustificativaDTO } from './justificativa-dto.model';
import { PontoService } from '../../services/ponto.service';
import { PrintPontoModalComponent } from '../print-ponto-modal/print-ponto-modal.component';

@Component({
  selector: 'app-main-bolsista',
  standalone: true,
  imports: [HeaderComponent, CommonModule, FormsModule, PrintPontoModalComponent],
  templateUrl: './main-bolsista.component.html',
  styleUrls: ['./main-bolsista.component.scss']
})
export class MainBolsistaComponent implements OnInit {
  bolsistaInfo?: BolsistaInfo;
  pontos: PontoDTO[] = [];
  justificativas: JustificativaDTO[] = [];
  errorMsg?: string;

  justificativaSelecionada?: JustificativaDTO;

  dataInicioImpressao: string = '';
  dataFimImpressao: string = '';
  carregandoImpressao: boolean = false;
  modalImpressaoAberto: boolean = false;

  abrirModalImpressao() {
    this.modalImpressaoAberto = true;
  }

  fecharModalImpressao() {
    if (this.carregandoImpressao) {
      return;
    }

    this.modalImpressaoAberto = false;
  }

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

  imprimirPonto() {
    if (!this.dataInicioImpressao || !this.dataFimImpressao) {
      alert('Por favor, selecione as datas de início e término.');
      return;
    }

    if (this.dataInicioImpressao > this.dataFimImpressao) {
      alert('A data de início não pode ser maior que a data de término.');
      return;
    }

    this.carregandoImpressao = true;

    // input type="date" => "YYYY-MM-DD"; API espera ISO com timezone Z.
    const dataInicio = `${this.dataInicioImpressao}T00:00:00.000Z`;
    const dataFim = `${this.dataFimImpressao}T23:59:59.999Z`;

    this.pontoService.imprimirPonto(dataInicio, dataFim).subscribe({
      next: (blob: Blob) => {
        this.carregandoImpressao = false;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ponto_${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.dataInicioImpressao = '';
        this.dataFimImpressao = '';
        this.modalImpressaoAberto = false;
      },
      error: (err) => {
        this.carregandoImpressao = false;
        console.error('Erro ao imprimir ponto:', err);
        alert(
          'Erro ao gerar o PDF. Por favor, tente novamente.\n\nErro: ' +
          (err.error?.message || err.message || 'Erro desconhecido')
        );
      }
    });
  }

  constructor(private http: HttpClient, private pontoService: PontoService) { }

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
