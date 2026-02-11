import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Formulario } from './formulario/formulario';
import { Tabla } from './tabla/tabla';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Formulario, Tabla],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('KilometrajeDietas');
}
