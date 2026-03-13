import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { BolsistaInfo } from './bolsista-info.model';

@Component({
  selector: 'app-main-bolsista',
  standalone: true,
  imports: [RouterLink, HeaderComponent, CommonModule],
  templateUrl: './main-bolsista.component.html',
  styleUrls: ['./main-bolsista.component.scss']
})
export class MainBolsistaComponent implements OnInit {
  bolsistaInfo?: BolsistaInfo;
  errorMsg?: string;

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
  }
}
