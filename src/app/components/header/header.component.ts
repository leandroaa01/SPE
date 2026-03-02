import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

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
    this.router.navigate(['/login']);
  }
}
