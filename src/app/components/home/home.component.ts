import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from "../header/header.component";
import { PontoService } from '../../services/ponto.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export enum Meses {
  Janeiro = 'Janeiro',
  Fevereiro = 'Fevereiro',
  Março = 'Março',
  Abril = 'Abril',
  Maio = 'Maio',
  Junho = 'Junho',
  Julho = 'Julho',
  Agosto = 'Agosto',
  Setembro = 'Setembro',
  Outubro = 'Outubro',
  Novembro = 'Novembro',
  Dezembro = 'Dezembro'
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  providers: [PontoService],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @Input() hora?: Date;

  agora: Date = new Date();
  alertaMsg?: string;
  alertaTipo: 'success' | 'error' | undefined;

  private idIntervalo?: number;
  private idTimeoutAlinhamento?: number;

  // Form fields para justificativa
  justificativaMotivo: string = '';
  justificativaData: string = '';
  justificativaHoras: number | null = null;
  justificativaMinutos: number | null = null;
  justificativaObs: string = '';
  justificativaEnviando = false;

  constructor(private pontoService: PontoService, private http: HttpClient) { }
  get justificativaFormValida(): boolean {
    return !!(
      this.justificativaMotivo &&
      this.justificativaData &&
      (this.justificativaHoras !== null && this.justificativaHoras >= 0) &&
      (this.justificativaMinutos !== null && this.justificativaMinutos >= 0) &&
      (this.justificativaHoras > 0 || this.justificativaMinutos > 0) &&
      this.justificativaObs.trim().length > 0
    );
  }

  enviarJustificativa(): void {
    if (!this.justificativaFormValida) return;
    this.justificativaEnviando = true;
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    // Montar data/hora no formato ISO
    const dataIso = this.justificativaData ? new Date(this.justificativaData).toISOString() : '';
    let qtdDeHoras = (Number(this.justificativaHoras) || 0) + ((Number(this.justificativaMinutos) || 0) / 60);
    qtdDeHoras = Number(qtdDeHoras.toFixed(2));
    const body = {
      data: dataIso,
      qtdDeHoras,
      motivo: this.justificativaMotivo,
      justificativa: this.justificativaObs
    };
    this.http.post('http://localhost:8080/spe/api/bolsista/justificar-ponto', body, { headers })
    
      .subscribe({
        next: () => {
          this.alertaMsg = 'Justificativa enviada com sucesso!';
          this.alertaTipo = 'success';
          this.justificativaEnviando = false;
          // Limpar formulário 
          //console.log(headers);
          this.justificativaMotivo = '';
          this.justificativaData = '';
          this.justificativaHoras = null;
          this.justificativaMinutos = null;
          this.justificativaObs = '';
          setTimeout(() => {
            this.alertaMsg = undefined;
            this.alertaTipo = undefined;
          }, 3000);
        },
        error: (err) => {
          this.alertaMsg = err.error || 'Erro ao enviar justificativa.';
          this.alertaTipo = 'error';
          this.justificativaEnviando = false;
          //console.error(err);
          setTimeout(() => {
            this.alertaMsg = undefined;
            this.alertaTipo = undefined;
          }, 3000);
        }
      });
  }

  ngOnInit(): void {
    if (this.hora) {
      this.agora = this.hora;
      return;
    }
    this.iniciarRelogio();
  }

  registrarPonto(): void {
    this.pontoService.registrarPonto().subscribe({
      next: (msg) => {
        this.alertaMsg = msg;
        this.alertaTipo = 'success';
        setTimeout(() => {
          this.alertaMsg = undefined;
          this.alertaTipo = undefined;
        }, 3000);
      },
      error: (err) => {
        this.alertaMsg = err.error || 'Erro ao registrar ponto.';
        this.alertaTipo = 'error';
        //console.error(err);
        setTimeout(() => {
          this.alertaMsg = undefined;
          this.alertaTipo = undefined;
        }, 3000);
      }
    });
  }

  ngOnDestroy(): void {
    this.pararRelogio();
  }

  private iniciarRelogio(): void {
    this.pararRelogio();

    const marcar = () => {
      this.agora = new Date();
    };

    // atualiza imediatamente
    marcar();

    const now = Date.now();
    const msParaProximoSegundo = 1000 - (now % 1000);

    this.idTimeoutAlinhamento = window.setTimeout(() => {
      marcar();
      this.idIntervalo = window.setInterval(() => marcar(), 1000);
    }, msParaProximoSegundo);
  }

  private pararRelogio(): void {
    if (this.idIntervalo !== undefined) {
      clearInterval(this.idIntervalo);
      this.idIntervalo = undefined;
    }
    if (this.idTimeoutAlinhamento !== undefined) {
      clearTimeout(this.idTimeoutAlinhamento);
      this.idTimeoutAlinhamento = undefined;
    }
  }

  get dataFormatada(): string {
    const d = this.agora ?? new Date();
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = Object.values(Meses)[d.getMonth()] || '';
    const ano = d.getFullYear();
    return `${dia} de ${mes} de ${ano}`;
  }
}
