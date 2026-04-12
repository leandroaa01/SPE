export type JustificaSituacao = 'DEFERIDO' | 'EMANALISE' | 'INDEFERIDO' | string;

export interface JustificativaListagemItem {
  id: number;
  nomeBolsista: string;
  motivo: string;
  justificativa: string;
  data: string;
  qtdDeHoras: number;
  justificaSituacao: JustificaSituacao;
  idBolsista?: number;

}
