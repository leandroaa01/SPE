import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-main-admin',
  standalone: true,
  imports: [RouterLink, HeaderComponent],
  templateUrl: './main-admin.component.html',
  styleUrl: './main-admin.component.scss'
})
export class MainAdminComponent {

}
