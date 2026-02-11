import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DietasService, RegistroDieta } from '../services/dietas.service';

@Component({
  selector: 'app-tabla',
  imports: [CommonModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css',
})
export class Tabla implements OnInit {
  private dietasService = inject(DietasService);

  registros: RegistroDieta[] = [];
  kmTotales: number = 0;
  importeTotal: number = 0;
  readonly PRECIO_KM = 0.23;
  mostrarModal: boolean = false;

  ngOnInit() {
    this.dietasService.registros$.subscribe((registros) => {
      this.registros = registros;
      this.calcularTotales();
    });
  }

  calcularTotales() {
    this.kmTotales = this.registros.reduce((total, registro) => total + registro.km, 0);
    this.importeTotal = this.kmTotales * this.PRECIO_KM;
  }

  eliminarRegistro(index: number) {
    this.dietasService.eliminarRegistro(index);
  }

  abrirModal() {
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
