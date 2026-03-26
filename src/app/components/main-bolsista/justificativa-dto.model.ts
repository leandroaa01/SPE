export interface JustificativaDTO {
    id: number;
    bolsista: any;
    data: string;
    qtdDeHoras: number;
    motivo: string;
    justificativa: string;
    tecnico: any;
    justificativaTecnico?: string;
    justificaSituacao: string;
    dataJustificativaTecnico?: string | null;
    nomeTecnico?: string;
}