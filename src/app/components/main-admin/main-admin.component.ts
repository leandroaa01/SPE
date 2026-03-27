import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AdminRegister } from './admin-register.model';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { TecnicoInfo } from "./tecnico-info.model"

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
  registerForm: FormGroup;
  registerSuccess: boolean = false;
  registerError: string | null = null;
  changePasswordForm: FormGroup;
  changePasswordSuccess: boolean = false;
  changePasswordError: string | null = null;

  constructor(private http: HttpClient, private fb: FormBuilder) {
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
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<TecnicoInfo>('http://localhost:8080/spe/api/admin/me', { headers })
      .subscribe({
        next: (data) => {
          this.tecnicoInfo = data;
          this.errorMsg = undefined;
        },
        error: (err) => {
          this.tecnicoInfo = undefined;
          this.errorMsg = 'Erro ao carregar dados do técnico.';
        }
      });
  }

  onRegisterSubmit() {
    console.log('submit registerForm', this.registerForm.value, this.registerForm.valid);
    if (this.registerForm.invalid) return;
    const body: AdminRegister = this.registerForm.value;
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.post('http://localhost:8080/spe/api/admin/register', body, { headers, responseType: 'text' }).subscribe({
      next: (data) => {
        //console.log('Resposta cadastro:', data);
        this.registerSuccess = true;
        this.registerError = null;
        this.registerForm.reset({ roles: 'BOLSISTA' });
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
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

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
