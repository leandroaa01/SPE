import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { MainBolsistaComponent } from './components/main-bolsista/main-bolsista.component';
import { MainAdminComponent } from './components/main-admin/main-admin.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'meus-dados',
    component: MainBolsistaComponent,
    canActivate: [authGuard],
    data: { role: 'BOLSISTA' }
  },
  {
    path: 'admin',
    component: MainAdminComponent,
    canActivate: [authGuard],
    data: { role: 'ADMIN' }
  }
];
