import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private readonly router = inject(Router);

  isRoute(path: string, exact = false): boolean {
    const currentPath = this.router.url.split('?')[0].split('#')[0];
    return exact ? currentPath === path : currentPath.startsWith(path);
  }
}
