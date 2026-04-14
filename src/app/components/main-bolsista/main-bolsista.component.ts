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
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-main-bolsista',
  standalone: true,
  imports: [
    HeaderComponent,
    CommonModule,
    FormsModule,
    PrintPontoModalComponent,
    NovoHorarioModalComponent,
  ],
  templateUrl: './main-bolsista.component.html',
  styleUrls: ['./main-bolsista.component.scss'],
})
export class MainBolsistaComponent implements OnInit {
  private readonly DIAS_PONTOS_EXIBIDOS = 5;
  private readonly MAX_PONTOS_EXIBIDOS = 5;
  private readonly MAX_JUSTIFICATIVAS_EXIBIDAS = 8;
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
    '17:00 - 18:00',
  ];

  meusHorariosTabela = this.criarTabelaBaseHorarios();

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
  totalHoras?: number;

  isAdminView = false;
  adminBolsistaId: number | null = null;

  formatDuracaoHoras(qtdDeHoras: number | null | undefined): string {
    if (qtdDeHoras == null || Number.isNaN(qtdDeHoras)) {
      return '-';
    }
    const totalMinutes = Math.round(qtdDeHoras * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  private buildAuthHeaders(): HttpHeaders | undefined {
    const token = localStorage.getItem('auth_token');
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
  }

  private parseDateSafe(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  private getDataLimiteUltimosDias(dias: number): Date {
    const agora = new Date();

    // Ex.: 5 dias => hoje + 4 dias anteriores (inclusivo)
    const limite = new Date(agora);
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - Math.max(0, dias - 1));

    return limite;
  }

  private parseHorasFeitas(value: unknown): number {
    if (value == null) {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    const raw = String(value).trim();
    if (!raw) {
      return 0;
    }

    // Normaliza formatos comuns: "2", "2.5", "2,5", "2 Hrs", "02:30"
    const normalized = raw
      .replace(/hrs?/gi, '')
      .replace(/\s+/g, '')
      .replace(',', '.');

    if (normalized.includes(':')) {
      const parts = normalized.split(':');
      const hours = Number(parts[0] || '0');
      const minutes = Number(parts[1] || '0');
      const seconds = Number(parts[2] || '0');

      if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes) ||
        !Number.isFinite(seconds)
      ) {
        return 0;
      }

      return hours + minutes / 60 + seconds / 3600;
    }

    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : 0;
  }

  private calcularTotalHorasFeitas(pontos: ReadonlyArray<PontoDTO>): number {
    const total = (pontos ?? []).reduce((sum, ponto) => {
      return sum + this.parseHorasFeitas((ponto as any)?.qtdDeHorasFeitas);
    }, 0);

    // Evita ruído de ponto flutuante
    return Math.round(total * 100) / 100;
  }

  get pontosExibidos(): PontoDTO[] {
    const limite = this.getDataLimiteUltimosDias(this.DIAS_PONTOS_EXIBIDOS);

    const pontosRecentes = (this.pontos ?? [])
      .map((ponto) => ({
        ponto,
        entrada: this.parseDateSafe(ponto.horasDeEntrada),
      }))
      .filter(({ entrada }) => !!entrada && entrada >= limite)
      .sort(
        (a, b) => (b.entrada as Date).getTime() - (a.entrada as Date).getTime(),
      )
      .slice(0, this.MAX_PONTOS_EXIBIDOS);

    // Exibir em ordem crescente (mais antigo -> mais novo)
    return pontosRecentes
      .sort(
        (a, b) => (a.entrada as Date).getTime() - (b.entrada as Date).getTime(),
      )
      .map(({ ponto }) => ponto);
  }

  get justificativasExibidas(): JustificativaDTO[] {
    return (this.justificativas ?? [])
      .map((justificativa) => ({
        justificativa,
        data: this.parseDateSafe(justificativa.data),
      }))
      .sort((a, b) => {
        const aTime = a.data ? a.data.getTime() : 0;
        const bTime = b.data ? b.data.getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, this.MAX_JUSTIFICATIVAS_EXIBIDAS)
      .map(({ justificativa }) => justificativa);
  }

  private parseTotalHorasResponse(raw: string): number {
    const trimmed = (raw ?? '').trim();

    if (!trimmed) {
      return 0;
    }

    let parsed: unknown = trimmed;

    try {
      parsed = JSON.parse(trimmed);
    } catch {
      // ignore: not JSON
    }

    if (
      parsed &&
      typeof parsed === 'object' &&
      'totalHoras' in (parsed as Record<string, unknown>)
    ) {
      parsed = (parsed as Record<string, unknown>)['totalHoras'];
    }

    const asNumber =
      typeof parsed === 'number'
        ? parsed
        : Number(String(parsed).replaceAll('"', '').trim());
    return Number.isFinite(asNumber) ? asNumber : 0;
  }

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
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    this.http
      .get<any>(
        `http://localhost:8080/spe/api/bolsista/minhas-justificativas/${id}`,
        { headers },
      )
      .subscribe({
        next: (data) => {
          this.justificativaSelecionada = data;
        },
        error: () => {
          this.justificativaSelecionada = undefined;
        },
      });
  }

  abrirJustificativaDetalhes(justificativa: JustificativaDTO) {
    if (this.isAdminView) {
      this.justificativaSelecionada = justificativa;
      return;
    }

    this.abrirJustificativa(justificativa.id);
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
            (err.error?.message || err.message || 'Erro desconhecido'),
        );
      },
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
        this.modalNovoHorarioAberto = false;
        this.carregarMeusHorarios();
        alert('Horários salvos com sucesso.');
      },
      error: (err) => {
        this.carregandoNovoHorario = false;
        console.error('Erro ao salvar horários:', err);
        alert(
          'Erro ao salvar os horários.\n\nErro: ' +
            (err.error?.message || err.message || 'Erro desconhecido'),
        );
      },
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
    return Object.values(horarios).filter((status) => status === 'bolsa')
      .length;
  }

  calcularCargaHorariaTotal() {
    return this.meusHorariosTabela.reduce(
      (total, linha) => total + this.calcularTotalHorasLinha(linha.horarios),
      0,
    );
  }

  private carregarMeusHorarios() {
    this.pontoService.obterMeusHorarios().subscribe({
      next: (payload) => {
        this.aplicarMeusHorariosDoBackend(payload);
      },
      error: () => {
        this.meusHorariosTabela = this.criarTabelaBaseHorarios();
      },
    });
  }

  private aplicarMeusHorariosDoBackend(payload: MeusHorariosPayload) {
    const tabelaBase = this.criarTabelaBaseHorarios();

    this.meusHorariosTabela = tabelaBase.map((linha) => {
      const diaSalvo = payload.dias.find(
        (dia) => this.normalizarDia(dia.dia) === linha.dia,
      );

      if (!diaSalvo) {
        return linha;
      }

      const horariosAtualizados = { ...linha.horarios };

      for (const horario of this.colunasHorario) {
        if (
          horariosAtualizados[horario] === 'almoco' ||
          horariosAtualizados[horario] === 'aula'
        ) {
          continue;
        }

        horariosAtualizados[horario] = diaSalvo.horariosSelecionados.includes(
          horario,
        )
          ? 'bolsa'
          : '';
      }

      return {
        ...linha,
        horarios: horariosAtualizados,
      };
    });
  }

  private criarTabelaBaseHorarios() {
    return [
      {
        dia: 'SEGUNDA_FEIRA',
        sigla: 'Seg',
        horarios: {
          '07:00 - 08:00': '',
          '08:00 - 09:00': '',
          '09:00 - 10:00': '',
          '10:00 - 11:00': '',
          '11:00 - 12:00': '',
          '12:00 - 13:00': 'almoco',
          '13:00 - 14:00': '',
          '14:00 - 15:00': '',
          '15:00 - 16:00': '',
          '16:00 - 17:00': '',
          '17:00 - 18:00': '',
        } as Record<string, string>,
      },
      {
        dia: 'TERCA_FEIRA',
        sigla: 'Ter',
        horarios: {
          '07:00 - 08:00': '',
          '08:00 - 09:00': '',
          '09:00 - 10:00': '',
          '10:00 - 11:00': '',
          '11:00 - 12:00': '',
          '12:00 - 13:00': 'almoco',
          '13:00 - 14:00': '',
          '14:00 - 15:00': '',
          '15:00 - 16:00': '',
          '16:00 - 17:00': '',
          '17:00 - 18:00': '',
        } as Record<string, string>,
      },
      {
        dia: 'QUARTA_FEIRA',
        sigla: 'Qua',
        horarios: {
          '07:00 - 08:00': '',
          '08:00 - 09:00': '',
          '09:00 - 10:00': '',
          '10:00 - 11:00': '',
          '11:00 - 12:00': '',
          '12:00 - 13:00': 'almoco',
          '13:00 - 14:00': '',
          '14:00 - 15:00': '',
          '15:00 - 16:00': '',
          '16:00 - 17:00': '',
          '17:00 - 18:00': '',
        } as Record<string, string>,
      },
      {
        dia: 'QUINTA_FEIRA',
        sigla: 'Qui',
        horarios: {
          '07:00 - 08:00': '',
          '08:00 - 09:00': '',
          '09:00 - 10:00': '',
          '10:00 - 11:00': '',
          '11:00 - 12:00': '',
          '12:00 - 13:00': 'almoco',
          '13:00 - 14:00': '',
          '14:00 - 15:00': '',
          '15:00 - 16:00': '',
          '16:00 - 17:00': '',
          '17:00 - 18:00': '',
        } as Record<string, string>,
      },
      {
        dia: 'SEXTA_FEIRA',
        sigla: 'Sex',
        horarios: {
          '07:00 - 08:00': '',
          '08:00 - 09:00': '',
          '09:00 - 10:00': '',
          '10:00 - 11:00': '',
          '11:00 - 12:00': '',
          '12:00 - 13:00': 'almoco',
          '13:00 - 14:00': '',
          '14:00 - 15:00': '',
          '15:00 - 16:00': '',
          '16:00 - 17:00': '',
          '17:00 - 18:00': '',
        } as Record<string, string>,
      },
    ];
  }

  private normalizarDia(dia: string) {
    const mapaDias: Record<string, string> = {
      SEG: 'SEGUNDA_FEIRA',
      SEGUNDA: 'SEGUNDA_FEIRA',
      SEGUNDA_FEIRA: 'SEGUNDA_FEIRA',
      TER: 'TERCA_FEIRA',
      TERCA: 'TERCA_FEIRA',
      TERÇA: 'TERCA_FEIRA',
      TERCA_FEIRA: 'TERCA_FEIRA',
      TERÇA_FEIRA: 'TERCA_FEIRA',
      QUA: 'QUARTA_FEIRA',
      QUARTA: 'QUARTA_FEIRA',
      QUARTA_FEIRA: 'QUARTA_FEIRA',
      QUI: 'QUINTA_FEIRA',
      QUINTA: 'QUINTA_FEIRA',
      QUINTA_FEIRA: 'QUINTA_FEIRA',
      SEX: 'SEXTA_FEIRA',
      SEXTA: 'SEXTA_FEIRA',
      SEXTA_FEIRA: 'SEXTA_FEIRA',
    };

    return mapaDias[dia?.trim().toUpperCase()] || dia;
  }

  constructor(
    private http: HttpClient,
    private pontoService: PontoService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const parsedId = idParam ? Number(idParam) : NaN;

    if (idParam && Number.isFinite(parsedId)) {
      this.isAdminView = true;
      this.adminBolsistaId = parsedId;
      this.carregarPerfilAdmin(parsedId);
      return;
    }

    this.isAdminView = false;
    this.adminBolsistaId = null;

    const headers = this.buildAuthHeaders();
    this.http
      .get<BolsistaInfo>('http://localhost:8080/spe/api/bolsista/me', {
        headers,
      })
      .subscribe({
        next: (data) => {
          this.bolsistaInfo = data;
          this.errorMsg = undefined;
        },
        error: (err) => {
          this.bolsistaInfo = undefined;
          this.errorMsg = 'Erro ao carregar dados do bolsista.';
        },
      });

    this.http
      .get<
        PontoDTO[]
      >('http://localhost:8080/spe/api/bolsista/meus-pontos', { headers })
      .subscribe({
        next: (data) => {
          this.pontos = data;
        },
        error: () => {
          this.pontos = [];
        },
      });

    this.carregarMeusHorarios();

    this.http
      .get<
        JustificativaDTO[]
      >('http://localhost:8080/spe/api/bolsista/minhas-justificativas', { headers })
      .subscribe({
        next: (data) => {
          //console.log('Justificativas recebidas:', data);
          this.justificativas = Array.isArray(data) ? data : [data];
        },
        error: (err) => {
          // console.error('Erro ao buscar justificativas:', err);
          this.justificativas = [];
        },
      });

    this.http
      .get<number>('http://localhost:8080/spe/api/bolsista/total-horas', {
        headers,
      })
      .subscribe({
        next: (data: number) => {
          this.totalHoras = data;
        },
        error: (err) => {
          console.error('Erro ao buscar total de horas:', err);
          this.totalHoras = 0;
        },
      });
  }

  private carregarPerfilAdmin(id: number): void {
    const headers = this.buildAuthHeaders();

    this.bolsistaInfo = undefined;
    this.errorMsg = undefined;
    this.pontos = [];
    this.justificativas = [];
    this.totalHoras = undefined;
    this.meusHorariosTabela = this.criarTabelaBaseHorarios();

    this.http
      .get<any>(
        `http://localhost:8080/spe/api/admin/bolsistas/dados/perfil/${id}`,
        { headers },
      )
      .subscribe({
        next: (data) => {
          this.bolsistaInfo = data?.dadosBolsista;

          const horarioPayload = data?.horarioBolsista;
          if (horarioPayload?.dias?.length) {
            this.aplicarMeusHorariosDoBackend(
              horarioPayload as MeusHorariosPayload,
            );
          } else {
            this.meusHorariosTabela = this.criarTabelaBaseHorarios();
          }

          this.pontos = Array.isArray(data?.pontosBolsista)
            ? data.pontosBolsista
            : [];
          this.justificativas = Array.isArray(data?.justificativaBolsistra)
            ? data.justificativaBolsistra
            : [];

          const pontosParaTotal = this.pontosExibidos;
          this.totalHoras = pontosParaTotal.length
            ? this.calcularTotalHorasFeitas(pontosParaTotal)
            : undefined;

          this.errorMsg = undefined;
        },
        error: () => {
          this.bolsistaInfo = undefined;
          this.errorMsg = 'Erro ao carregar dados do bolsista (admin).';
        },
      });
  }
}
