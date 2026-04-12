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

@Component({
  selector: 'app-main-admin',
  standalone: true,
  imports: [RouterLink, HeaderComponent, CommonModule, ReactiveFormsModule],
  templateUrl: './main-admin.component.html',
  styleUrl: './main-admin.component.scss'
})
export class MainAdminComponent {
  tecnicoInfo?: TecnicoInfo;
  errorMsg: string | undefined;
  bolsistas: BolsistaListagemItem[] = [];
  bolsistasLoading = false;
  bolsistasError: string | null = null;
  pontosBolsistas: PontoBolsistaListagemItem[] = [];
  pontosBolsistasLoading = false;
  pontosBolsistasError: string | null = null;
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

  constructor(private http: HttpClient, private fb: FormBuilder) {
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
  }

  ngOnInit(): void {
    this.loadTecnicoInfo();
    this.loadBolsistas();
    this.loadPontosBolsistas();
  }

  private buildAuthHeaders(): HttpHeaders | undefined {
    const token = localStorage.getItem('auth_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
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

  isBolsistaAtivo(situacao: string | null | undefined): boolean {
    return (situacao || '').toUpperCase() === 'ATIVO';
  }

  formatSituacao(situacao: string | null | undefined): string {
    const raw = (situacao || '').trim();
    if (!raw) {
      return '';
    }

    const normalized = raw.replace(/_/g, ' ').toLowerCase();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
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

  formatHorasFeitas(qtdDeHorasFeitas: number | null | undefined): string {
    if (qtdDeHorasFeitas == null || Number.isNaN(qtdDeHorasFeitas)) {
      return '-';
    }
    return `${qtdDeHorasFeitas} Hrs`;
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

}
