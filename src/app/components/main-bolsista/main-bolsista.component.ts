import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from "../header/header.component";

@Component({
  selector: 'app-main-bolsista',
  standalone: true,
  imports: [RouterLink, HeaderComponent],
  templateUrl: './main-bolsista.component.html',
  styleUrls: ['./main-bolsista.component.scss']
})
export class MainBolsistaComponent {

}
