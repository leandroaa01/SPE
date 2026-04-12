import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { HorarioDiaPayload, MeusHorariosPayload } from '../../services/ponto.service';

interface DiaHorarioForm {
  dia: string;
  label: string;
  horariosSelecionados: string[];
}

@Component({
  selector: 'app-novo-horario-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './novo-horario-modal.component.html',
  styleUrl: './novo-horario-modal.component.scss'
})
export class NovoHorarioModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() carregando = false;

  @Output() close = new EventEmitter<void>();
  @Output() salvar = new EventEmitter<MeusHorariosPayload>();

  readonly horariosDisponiveis = [
    '07:00 - 08:00',
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '17:00 - 18:00'
  ];

  readonly dias: DiaHorarioForm[] = [
    { dia: 'SEGUNDA_FEIRA', label: 'Segunda-feira', horariosSelecionados: [] },
    { dia: 'TERCA_FEIRA', label: 'Terça-feira', horariosSelecionados: [] },
    { dia: 'QUARTA_FEIRA', label: 'Quarta-feira', horariosSelecionados: [] },
    { dia: 'QUINTA_FEIRA', label: 'Quinta-feira', horariosSelecionados: [] },
    { dia: 'SEXTA_FEIRA', label: 'Sexta-feira', horariosSelecionados: [] }
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible']?.currentValue === true) {
      this.limparFormulario();
    }
  }

  fecharModal() {
    if (this.carregando) {
      return;
    }

    this.close.emit();
  }

  alternarHorario(dia: DiaHorarioForm, horario: string, marcado: boolean) {
    if (marcado) {
      if (!dia.horariosSelecionados.includes(horario)) {
        dia.horariosSelecionados = [...dia.horariosSelecionados, horario];
      }
      return;
    }

    dia.horariosSelecionados = dia.horariosSelecionados.filter(item => item !== horario);
  }

  horarioSelecionado(dia: DiaHorarioForm, horario: string) {
    return dia.horariosSelecionados.includes(horario);
  }

  totalHoras(dia: DiaHorarioForm) {
    return dia.horariosSelecionados.length;
  }

  salvarHorarios() {
    const diasSelecionados: HorarioDiaPayload[] = this.dias
      .filter(dia => dia.horariosSelecionados.length > 0)
      .map(dia => ({
        dia: dia.dia,
        horariosSelecionados: dia.horariosSelecionados,
        totalHoras: this.totalHoras(dia)
      }));

    this.salvar.emit({ dias: diasSelecionados });
  }

  limparFormulario() {
    for (const dia of this.dias) {
      dia.horariosSelecionados = [];
    }
  }
}
