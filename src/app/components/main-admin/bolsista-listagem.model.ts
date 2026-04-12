export type BolsistaSituacao = 'ATIVO'| 'DESATIVADA' | string;

export interface BolsistaListagemItem {
  id: number;
  nome: string;
  username: string;
  matricula: string;
  email: string;
  situacao: BolsistaSituacao;
  dataCriacao?: string;
  cargo?: string;
}
