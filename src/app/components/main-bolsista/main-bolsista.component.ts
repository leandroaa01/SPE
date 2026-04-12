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
import { NovoHorarioModalComponent } from '../novo-horario-modal/novo-horario-modal.component';
import { MeusHorariosPayload } from '../../services/ponto.service';

@Component({
  selector: 'app-main-bolsista',
  standalone: true,
  imports: [HeaderComponent, CommonModule, FormsModule, PrintPontoModalComponent, NovoHorarioModalComponent],
  templateUrl: './main-bolsista.component.html',
  styleUrls: ['./main-bolsista.component.scss']
})
export class MainBolsistaComponent implements OnInit {
  readonly colunasHorario: string[] = [
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '12:00 - 13:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00'
  ];

  meusHorariosTabela = [
    {
      dia: 'SEGUNDA_FEIRA',
      sigla: 'Seg',
      horarios: {
        '07:00 - 08:00': 'bolsa',
        '08:00 - 09:00': 'bolsa',
        '09:00 - 10:00': 'aula',
        '10:00 - 11:00': 'aula',
        '11:00 - 12:00': 'aula',
        '12:00 - 13:00': 'almoco',
        '13:00 - 14:00': 'bolsa',
        '14:00 - 15:00': 'bolsa',
        '15:00 - 16:00': 'bolsa',
        '16:00 - 17:00': '',
        '17:00 - 18:00': ''
      } as Record<string, string>
    },
    {
      dia: 'TERCA_FEIRA',
      sigla: 'Ter',
      horarios: {
        '07:00 - 08:00': 'bolsa',
        '08:00 - 09:00': 'bolsa',
        '09:00 - 10:00': 'aula',
        '10:00 - 11:00': 'aula',
        '11:00 - 12:00': 'aula',
        '12:00 - 13:00': 'almoco',
        '13:00 - 14:00': 'aula',
        '14:00 - 15:00': 'aula',
        '15:00 - 16:00': 'bolsa',
        '16:00 - 17:00': '',
        '17:00 - 18:00': ''
      } as Record<string, string>
    },
    {
      dia: 'QUARTA_FEIRA',
      sigla: 'Qua',
      horarios: {
        '07:00 - 08:00': 'bolsa',
        '08:00 - 09:00': 'bolsa',
        '09:00 - 10:00': 'aula',
        '10:00 - 11:00': 'aula',
        '11:00 - 12:00': 'aula',
        '12:00 - 13:00': 'almoco',
        '13:00 - 14:00': 'bolsa',
        '14:00 - 15:00': 'bolsa',
        '15:00 - 16:00': 'bolsa',
        '16:00 - 17:00': '',
        '17:00 - 18:00': ''
      } as Record<string, string>
    },
    {
      dia: 'QUINTA_FEIRA',
      sigla: 'Qui',
      horarios: {
        '07:00 - 08:00': 'bolsa',
        '08:00 - 09:00': 'bolsa',
        '09:00 - 10:00': 'aula',
        '10:00 - 11:00': 'aula',
        '11:00 - 12:00': 'aula',
        '12:00 - 13:00': 'almoco',
        '13:00 - 14:00': 'aula',
        '14:00 - 15:00': 'aula',
        '15:00 - 16:00': 'bolsa',
        '16:00 - 17:00': '',
        '17:00 - 18:00': ''
      } as Record<string, string>
    },
    {
      dia: 'SEXTA_FEIRA',
      sigla: 'Sex',
      horarios: {
        '07:00 - 08:00': 'bolsa',
        '08:00 - 09:00': 'bolsa',
        '09:00 - 10:00': 'bolsa',
        '10:00 - 11:00': 'bolsa',
        '11:00 - 12:00': 'bolsa',
        '12:00 - 13:00': 'almoco',
        '13:00 - 14:00': 'bolsa',
        '14:00 - 15:00': '',
        '15:00 - 16:00': '',
        '16:00 - 17:00': '',
        '17:00 - 18:00': ''
      } as Record<string, string>
    }
  ];

  bolsistaInfo?: BolsistaInfo;
  pontos: PontoDTO[] = [];
  justificativas: JustificativaDTO[] = [];
  errorMsg?: string;

  justificativaSelecionada?: JustificativaDTO;

  dataInicioImpressao: string = '';
  dataFimImpressao: string = '';
  carregandoImpressao: boolean = false;
  modalImpressaoAberto: boolean = false;
  modalNovoHorarioAberto: boolean = false;
  carregandoNovoHorario: boolean = false;

  abrirModalImpressao() {
    this.modalImpressaoAberto = true;
  }

  abrirModalNovoHorario() {
    this.modalNovoHorarioAberto = true;
  }

  fecharModalImpressao() {
    if (this.carregandoImpressao) {
      return;
    }

    this.modalImpressaoAberto = false;
  }

  fecharModalNovoHorario() {
    if (this.carregandoNovoHorario) {
      return;
    }

    this.modalNovoHorarioAberto = false;
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

  salvarMeusHorarios(payload: MeusHorariosPayload) {
    if (payload.dias.length === 0) {
      alert('Selecione pelo menos um horário antes de salvar.');
      return;
    }

    this.carregandoNovoHorario = true;

    this.pontoService.salvarMeusHorarios(payload).subscribe({
      next: () => {
        this.carregandoNovoHorario = false;
        this.atualizarTabelaHorarios(payload);
        this.modalNovoHorarioAberto = false;
        alert('Horários salvos com sucesso.');
      },
      error: (err) => {
        this.carregandoNovoHorario = false;
        console.error('Erro ao salvar horários:', err);
        alert(
          'Erro ao salvar os horários.\n\nErro: ' +
          (err.error?.message || err.message || 'Erro desconhecido')
        );
      }
    });
  }

  obterTextoStatus(tipo: string) {
    if (tipo === 'bolsa') {
      return 'Em bolsa';
    }

    if (tipo === 'aula') {
      return 'Em aula';
    }

    if (tipo === 'almoco') {
      return 'Almoço';
    }

    return '';
  }

  obterClasseStatus(tipo: string) {
    if (tipo === 'bolsa') {
      return 'badge-horario-bolsa';
    }

    if (tipo === 'aula' || tipo === 'almoco') {
      return 'badge-horario';
    }

    return '';
  }

  calcularTotalHorasLinha(horarios: Record<string, string>) {
    return Object.values(horarios).filter(status => status === 'bolsa').length;
  }

  calcularCargaHorariaTotal() {
    return this.meusHorariosTabela.reduce((total, linha) => total + this.calcularTotalHorasLinha(linha.horarios), 0);
  }

  private atualizarTabelaHorarios(payload: MeusHorariosPayload) {
    const horariosEditaveis = this.colunasHorario.filter(horario => horario !== '12:00 - 13:00');

    this.meusHorariosTabela = this.meusHorariosTabela.map(linha => {
      const diaSalvo = payload.dias.find(dia => dia.dia === linha.dia);

      if (!diaSalvo) {
        return linha;
      }

      const horariosAtualizados = { ...linha.horarios };

      for (const horario of horariosEditaveis) {
        if (horariosAtualizados[horario] === 'almoco' || horariosAtualizados[horario] === 'aula') {
          continue;
        }

        horariosAtualizados[horario] = diaSalvo.horariosSelecionados.includes(horario) ? 'bolsa' : '';
      }

      return {
        ...linha,
        horarios: horariosAtualizados
      };
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
