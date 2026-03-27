import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {TecnicoInfo} from "./tecnico-info.model"

@Component({
  selector: 'app-main-admin',
  standalone: true,
  imports: [RouterLink, HeaderComponent, CommonModule],
  templateUrl: './main-admin.component.html',
  styleUrl: './main-admin.component.scss'
})
export class MainAdminComponent {
constructor(private http: HttpClient) { }
   tecnicoInfo?: TecnicoInfo;
   errorMsg: string | undefined;
  ngOnInit(): void {
    const token = localStorage.getItem('auth_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    this.http.get<TecnicoInfo>('http://localhost:8080/spe/api/admin/me', { headers })
      .subscribe({
        next: (data) => {
          console.log(data);
          this.tecnicoInfo = data;
          this.errorMsg = undefined;
        },
        error: (err) => {
          this.tecnicoInfo = undefined;
          this.errorMsg = 'Erro ao carregar dados do técnico.';
        }
      });
}}
