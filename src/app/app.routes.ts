import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MainBolsistaComponent } from './components/main-bolsista/main-bolsista.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'meus-dados',
    component: MainBolsistaComponent
  }
];
