import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminRegister } from './admin-register.model';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TecnicoInfo } from "./tecnico-info.model"
import { BolsistaListagemItem } from './bolsista-listagem.model';
import { PontoBolsistaListagemItem } from './ponto-bolsista-listagem.model';
import { JustificativaListagemItem } from './justificativa-listagem.model';

@Component({
  selector: 'app-main-admin',
  standalone: true,
  imports: [RouterLink, HeaderComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './main-admin.component.html',
  styleUrl: './main-admin.component.scss'
})
export class MainAdminComponent {
  private readonly MAX_PONTOS_BOLSISTAS_EXIBIDOS = 10;

  tecnicoInfo?: TecnicoInfo;
  errorMsg: string | undefined;
  bolsistas: BolsistaListagemItem[] = [];
  bolsistasLoading = false;
  bolsistasError: string | null = null;
  pontosBolsistas: PontoBolsistaListagemItem[] = [];
  pontosBolsistasLoading = false;
  pontosBolsistasError: string | null = null;
  justificativas: JustificativaListagemItem[] = [];
  justificativasLoading = false;
  justificativasError: string | null = null;
  selectedJustificativa: JustificativaListagemItem | null = null;
  updateJustificativaForm: FormGroup;
  updateJustificativaLoading = false;
  updateJustificativaSuccess = false;
  updateJustificativaError: string | null = null;
  editBolsistaForm: FormGroup;
  editingBolsistaId: number | null = null;
  editBolsistaSuccess = false;
  editBolsistaError: string | null = null;
  registerForm: FormGroup;
  registerSuccess: boolean = false;
  registerError: string | null = null;
  changePasswordForm: FormGroup;
  changePasswordSuccess: boolean = false;
  changePasswordError: string | null = null;
  filterForm: FormGroup;

  imprimirPontoForm: FormGroup;
  imprimirPontoLoading = false;
  imprimirPontoError: string | null = null;

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      nome: ['']
    });

    this.updateJustificativaForm = this.fb.group({
      status: ['EMANALISE', Validators.required],
      observacoes: ['']
    });

    this.editBolsistaForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      matricula: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['BOLSISTA', Validators.required],
      situacao: ['ATIVO', Validators.required],
      cargo: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      username: ['', Validators.required],
      matricula: ['', Validators.required],
      password: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      roles: ['BOLSISTA', Validators.required],
      cargo: ['', Validators.required]
    });

    this.changePasswordForm = this.fb.group({
      matricula: ['', Validators.required],
      senhaNova: ['', Validators.required],
      senhaConfirmacao: ['', Validators.required]
    });

    this.imprimirPontoForm = this.fb.group({
      username: ['', Validators.required],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadTecnicoInfo();
    this.loadBolsistas();
    this.loadPontosBolsistas();
    this.loadJustificativas();
  }

  private normalizeText(value: string | null | undefined): string {
    return (value ?? '').trim().toLowerCase();
  }

  private matchesNome(value: string | null | undefined): boolean {
    const query = this.normalizeText(this.filterForm?.get('nome')?.value);
    if (!query) {
      return true;
    }

    return this.normalizeText(value).includes(query);
  }

  get bolsistasFiltrados(): BolsistaListagemItem[] {
    return (this.bolsistas ?? []).filter((b) => this.matchesNome((b as any).nome));
  }

  get pontosBolsistasFiltrados(): PontoBolsistaListagemItem[] {
    return (this.pontosBolsistasExibidos ?? []).filter((p) => this.matchesNome(p?.nome));
  }

  get justificativasFiltradas(): JustificativaListagemItem[] {
    return (this.justificativas ?? []).filter((j) => this.matchesNome((j as any).nomeBolsista));
  }

  private buildAuthHeaders(): HttpHeaders | undefined {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }

  private parseDateMs(value: string | null | undefined): number {
    if (!value) {
      return 0;
    }

    const parsed = new Date(value);
    const time = parsed.getTime();
    return Number.isFinite(time) ? time : 0;
  }

  get pontosBolsistasExibidos(): PontoBolsistaListagemItem[] {
    return [...(this.pontosBolsistas ?? [])]
      .sort((a, b) => this.parseDateMs(b?.horaDeEntrada) - this.parseDateMs(a?.horaDeEntrada))
      .slice(0, this.MAX_PONTOS_BOLSISTAS_EXIBIDOS);
  }

  private loadTecnicoInfo(): void {
    const headers = this.buildAuthHeaders();
    this.http.get<TecnicoInfo>('http://localhost:8080/spe/api/admin/me', { headers })
      .subscribe({
        next: (data) => {
          this.tecnicoInfo = data;
          this.errorMsg = undefined;
        },
        error: () => {
          this.tecnicoInfo = undefined;
          this.errorMsg = 'Erro ao carregar dados do técnico.';
        }
      });
  }

  private loadBolsistas(): void {
    this.bolsistasLoading = true;
    this.bolsistasError = null;

    const headers = this.buildAuthHeaders();
    this.http.get<BolsistaListagemItem[]>('http://localhost:8080/spe/api/admin/listagem/bolsistas', { headers })
      .subscribe({
        next: (data) => {
          const list = Array.isArray(data) ? data : [];
          this.bolsistas = list.map((b: any) => ({
            ...b,
            dataCriacao: b?.dataCriacao ?? b?.data_criacao
          }));
          this.bolsistasLoading = false;
        },
        error: () => {
          this.bolsistas = [];
          this.bolsistasLoading = false;
          this.bolsistasError = 'Erro ao carregar bolsistas.';
        }
      });
  }

  private loadPontosBolsistas(): void {
    this.pontosBolsistasLoading = true;
    this.pontosBolsistasError = null;

    const headers = this.buildAuthHeaders();
    this.http.get<PontoBolsistaListagemItem[] | PontoBolsistaListagemItem>(
      'http://localhost:8080/spe/api/admin/pontos/bolsistas/listagem',
      { headers }
    )
      .subscribe({
        next: (data) => {
          const list = Array.isArray(data) ? data : (data ? [data] : []);
          this.pontosBolsistas = list;
          this.pontosBolsistasLoading = false;
        },
        error: () => {
          this.pontosBolsistas = [];
          this.pontosBolsistasLoading = false;
          this.pontosBolsistasError = 'Erro ao carregar pontos dos bolsistas.';
        }
      });
  }

  private loadJustificativas(): void {
    this.justificativasLoading = true;
    this.justificativasError = null;

    const headers = this.buildAuthHeaders();
    this.http.get<JustificativaListagemItem[] | JustificativaListagemItem>(
      'http://localhost:8080/spe/api/admin/listagem/justificativas',
      { headers }
    )
      .subscribe({
        next: (data) => {
          const list = Array.isArray(data) ? data : (data ? [data] : []);
          this.justificativas = list.map((j: any) => ({
            ...j,
            idBolsista: j?.idBolsista ?? j?.bolsistaId ?? j?.id_bolsista
          }));
          this.justificativasLoading = false;
        },
        error: () => {
          this.justificativas = [];
          this.justificativasLoading = false;
          this.justificativasError = 'Erro ao carregar justificativas.';
        }
      });
  }

  isBolsistaAtivo(situacao: string | null | undefined): boolean {
    return (situacao || '').toUpperCase() === 'ATIVO';
  }

  formatSituacao(situacao: string | null | undefined): string {
    const raw = (situacao || '').trim();
    if (!raw) {
      return '';
    }

    const upper = raw.toUpperCase();
    if (upper === 'EMANALISE' || upper === 'EM_ANALISE' || upper === 'EM-ANALISE') {
      return 'Em-Analise';
    }

    const normalized = raw.replace(/_/g, ' ').toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  normalizeJustificaSituacaoValue(status: string | null | undefined): string {
    const upper = (status || '').trim().toUpperCase();
    if (upper === 'EMANALISE' || upper === 'EM-ANALISE') {
      return 'EMANALISE';
    }
    return upper;
  }

  getPontoStatusBadgeClass(status: string | null | undefined): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'FECHADO') {
      return 'badge-success';
    }
    if (normalized === 'INDEFERIDO' || normalized === 'NEGADO') {
      return 'badge-denied';
    }
    return 'badge-analyze';
  }

  getJustificativaStatusBadgeClass(status: string | null | undefined): string {
    const normalized = (status || '').toUpperCase();
    if (normalized === 'DEFERIDO') {
      return 'badge-success';
    }
    if (normalized === 'INDEFERIDO') {
      return 'badge-denied';
    }
    return 'badge-analyze';
  }

  formatHorasFeitas(qtdDeHorasFeitas: number | null | undefined): string {
    if (qtdDeHorasFeitas == null || Number.isNaN(qtdDeHorasFeitas)) {
      return '-';
    }
    return `${qtdDeHorasFeitas} Hrs`;
  }

  formatDuracaoHoras(qtdDeHoras: number | null | undefined): string {
    if (qtdDeHoras == null || Number.isNaN(qtdDeHoras)) {
      return '-';
    }
    const totalMinutes = Math.round(qtdDeHoras * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  }

  getDuracaoHorasInteiras(qtdDeHoras: number | null | undefined): string {
    if (qtdDeHoras == null || Number.isNaN(qtdDeHoras)) {
      return '-';
    }
    const totalMinutes = Math.round(qtdDeHoras * 60);
    return String(Math.floor(totalMinutes / 60));
  }

  getDuracaoMinutos(qtdDeHoras: number | null | undefined): string {
    if (qtdDeHoras == null || Number.isNaN(qtdDeHoras)) {
      return '-';
    }
    const totalMinutes = Math.round(qtdDeHoras * 60);
    return String(totalMinutes % 60);
  }

  openJustificativaModal(justificativa: JustificativaListagemItem): void {
    this.selectedJustificativa = justificativa;

    this.updateJustificativaSuccess = false;
    this.updateJustificativaError = null;
    this.updateJustificativaForm.reset({
      status:
        this.normalizeJustificaSituacaoValue(justificativa.justificaSituacao) ||
        'EMANALISE',
      observacoes: '',
    });
  }

  onUpdateJustificativaSubmit(): void {
    this.updateJustificativaSuccess = false;
    this.updateJustificativaError = null;

    if (!this.selectedJustificativa) {
      this.updateJustificativaError = 'Nenhuma justificativa selecionada.';
      return;
    }

    const id = this.selectedJustificativa.id;
    const idBolsista = (this.selectedJustificativa as any).idBolsista;
    if (idBolsista == null) {
      this.updateJustificativaError = 'Backend não retornou idBolsista nesta listagem.';
      return;
    }

    if (this.updateJustificativaForm.invalid) {
      this.updateJustificativaError = 'Preencha o status.';
      return;
    }

    this.updateJustificativaLoading = true;
    const headers = this.buildAuthHeaders();
    const url = `http://localhost:8080/spe/api/admin/justificativa/${idBolsista}/detalhes/${id}/atualizar`;
    const body = this.updateJustificativaForm.value;

    this.http.put(url, body, { headers, responseType: 'text' }).subscribe({
      next: () => {
        this.updateJustificativaLoading = false;
        this.updateJustificativaSuccess = true;
        this.updateJustificativaError = null;
        this.loadJustificativas();
      },
      error: (err) => {
        this.updateJustificativaLoading = false;
        this.updateJustificativaSuccess = false;
        this.updateJustificativaError = err?.error?.message || 'Erro ao atualizar justificativa.';
      }
    });
  }

  openEditModal(bolsista: BolsistaListagemItem): void {
    this.editBolsistaSuccess = false;
    this.editBolsistaError = null;
    this.editingBolsistaId = bolsista.id;

    this.editBolsistaForm.reset({
      name: (bolsista.nome || '').trim(),
      username: (bolsista.username || '').trim(),
      matricula: (bolsista.matricula || '').trim(),
      email: (bolsista.email || '').trim(),
      role: 'BOLSISTA',
      situacao: (bolsista.situacao || 'ATIVO').toString().toUpperCase(),
      cargo: (bolsista.cargo || '').trim( )
    });
  }

  onEditBolsistaSubmit(): void {
    this.editBolsistaSuccess = false;
    this.editBolsistaError = null;

    if (this.editBolsistaForm.invalid || this.editingBolsistaId == null) {
      this.editBolsistaError = 'Preencha todos os campos obrigatórios.';
      return;
    }

    const headers = this.buildAuthHeaders();
    const body = this.editBolsistaForm.value;
    const url = `http://localhost:8080/spe/api/admin/mudar-dados/bolsista/${this.editingBolsistaId}`;

    this.http.put(url, body, { headers, responseType: 'text' }).subscribe({
      next: () => {
        this.editBolsistaSuccess = true;
        this.editBolsistaError = null;
        this.loadBolsistas();
      },
      error: (err) => {
        this.editBolsistaSuccess = false;
        this.editBolsistaError = err?.error?.message || 'Erro ao editar bolsista.';
      }
    });
  }

  onRegisterSubmit() {
    console.log('submit registerForm', this.registerForm.value, this.registerForm.valid);
    if (this.registerForm.invalid) return;
    const body: AdminRegister = this.registerForm.value;
    const headers = this.buildAuthHeaders();
    this.http.post('http://localhost:8080/spe/api/admin/register', body, { headers, responseType: 'text' }).subscribe({
      next: (data) => {
        //console.log('Resposta cadastro:', data);
        this.registerSuccess = true;
        this.registerError = null;
        this.registerForm.reset({ roles: 'BOLSISTA' });
        this.loadBolsistas();
      },
      error: (err) => {
       // console.log(err);
        this.registerSuccess = false;
        this.registerError = err?.error?.message || 'Erro ao cadastrar usuário.';
      }
    });
  }

  onChangePassword() {
    console.log('submit changePasswordForm', this.changePasswordForm.value, this.changePasswordForm.valid);
    if (this.changePasswordForm.invalid) return;

    const { matricula, senhaNova, senhaConfirmacao } = this.changePasswordForm.value;
    if (senhaNova !== senhaConfirmacao) {
      this.changePasswordSuccess = false;
      this.changePasswordError = 'As senhas não coincidem.';
      return;
    }

    const body = { matricula, senhaNova, senhaConfirmacao };
    const headers = this.buildAuthHeaders();

    this.http.put('http://localhost:8080/spe/api/admin/mudar-senha/bolsista/', body, { headers, responseType: 'text' })
      .subscribe({
        next: (data) => {
         // console.log('Resposta mudar senha:', data);
          this.changePasswordSuccess = true;
          this.changePasswordError = null;
          this.changePasswordForm.reset();
        },
        error: (err) => {
          //console.log(err);
          this.changePasswordSuccess = false;
          this.changePasswordError = err?.error?.message || 'Erro ao atualizar senha.';
        }
      });
  }

  private parseBrDateToYmd(value: string): string | null {
    const raw = (value || '').trim();
    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      !Number.isFinite(day) ||
      !Number.isFinite(month) ||
      !Number.isFinite(year) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    // Valida data real (ex.: 31/02 inválido)
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    const dd = String(day).padStart(2, '0');
    const mm = String(month).padStart(2, '0');
    const yyyy = String(year).padStart(4, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  imprimirPontoBolsista(): void {
    this.imprimirPontoError = null;

    if (this.imprimirPontoForm.invalid) {
      this.imprimirPontoError = 'Preencha username, data de início e data de término.';
      return;
    }

    const username = String(this.imprimirPontoForm.value.username || '').trim();
    const dataInicioBr = String(this.imprimirPontoForm.value.dataInicio || '').trim();
    const dataFimBr = String(this.imprimirPontoForm.value.dataFim || '').trim();

    if (!username) {
      this.imprimirPontoError = 'Informe o username do bolsista.';
      return;
    }

    if (!dataInicioBr || !dataFimBr) {
      this.imprimirPontoError = 'Selecione as datas de início e término.';
      return;
    }

    const dataInicioYmd = this.parseBrDateToYmd(dataInicioBr);
    const dataFimYmd = this.parseBrDateToYmd(dataFimBr);

    if (!dataInicioYmd || !dataFimYmd) {
      this.imprimirPontoError = 'Formato de data inválido. Use dd/mm/aaaa.';
      return;
    }

    // API espera ISO com timezone Z.
    const dataInicioIso = `${dataInicioYmd}T00:00:00.000Z`;
    const dataFimIso = `${dataFimYmd}T23:59:59.999Z`;

    if (dataInicioYmd > dataFimYmd) {
      this.imprimirPontoError = 'A data de início não pode ser maior que a data de término.';
      return;
    }

    this.imprimirPontoLoading = true;

    const headers = this.buildAuthHeaders();
    const url = 'http://localhost:8080/spe/api/admin/imprimir-ponto/bolsista/';

    this.http
      .get(url, {
        headers,
        params: {
          username,
          dataInicio: dataInicioIso,
          dataFim: dataFimIso,
        },
        responseType: 'blob',
      })
      .subscribe({
        next: (blob: Blob) => {
          this.imprimirPontoLoading = false;

          const safeUser = username.replace(/[^a-zA-Z0-9_-]+/g, '_');
          const downloadName = `ponto_${safeUser}_${new Date().getTime()}.pdf`;

          const fileUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = downloadName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(fileUrl);
        },
        error: (err) => {
          this.imprimirPontoLoading = false;
          console.error('Erro ao imprimir ponto (admin):', err);
          this.imprimirPontoError =
            err?.error?.message || err?.message || 'Erro ao gerar o PDF.';
        },
      });
  }

}
