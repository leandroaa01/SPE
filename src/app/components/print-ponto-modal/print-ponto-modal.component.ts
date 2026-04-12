import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-print-ponto-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './print-ponto-modal.component.html',
  styleUrl: './print-ponto-modal.component.scss'
})
export class PrintPontoModalComponent {
  @Input() visible = false;
  @Input() dataInicio = '';
  @Input() dataFim = '';
  @Input() carregando = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirmar = new EventEmitter<void>();
  @Output() dataInicioChange = new EventEmitter<string>();
  @Output() dataFimChange = new EventEmitter<string>();

  fecharModal() {
    this.close.emit();
  }

  confirmarImpressao() {
    this.confirmar.emit();
  }

  atualizarDataInicio(valor: string) {
    this.dataInicioChange.emit(valor);
  }

  atualizarDataFim(valor: string) {
    this.dataFimChange.emit(valor);
  }
}
