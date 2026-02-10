import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MainBolsistaComponent } from './components/main-bolsista/main-bolsista.component';
import { MainAdminComponent } from './components/main-admin/main-admin.component';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: HomeComponent
  },
//mudar rotas depois.
  {
    path: 'meus-dados',
    component: MainBolsistaComponent
  },

  {
    path:'admin',
    component: MainAdminComponent
  }

];
