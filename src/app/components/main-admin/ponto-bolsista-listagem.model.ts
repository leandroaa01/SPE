export type PontoStatus = 'FECHADO' | 'ABERTO' | string;

export interface PontoBolsistaListagemItem {
  nome: string;
  horaDeEntrada: string;
  horaDeSaida?: string | null;
  status: PontoStatus;
  qtdDeHorasFeitas: number;
}
