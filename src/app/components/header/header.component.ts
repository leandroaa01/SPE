import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.getNormalizedRoles().includes('ADMIN');
  }

  isRoute(path: string, exact = false): boolean {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    return exact ? currentPath === path : currentPath.startsWith(path);
  }

  get profileRoute(): string {
    const roles = this.authService.getRoles().map((role) => role.replace(/^ROLE_/, ''));
    return roles.includes('ADMIN') ? '/admin' : '/meus-dados';
  }

  logout(event: Event): void {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/home']);
  }
}
