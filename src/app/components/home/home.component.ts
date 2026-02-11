import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from "../header/header.component";

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
  imports: [CommonModule, HeaderComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @Input() hora?: Date;

  agora: Date = new Date();

  private idIntervalo?: number;
  private idTimeoutAlinhamento?: number;

  ngOnInit(): void {
    if (this.hora) {
      this.agora = this.hora;
      return;
    }
    this.iniciarRelogio();
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
