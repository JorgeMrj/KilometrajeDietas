import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DietasService } from '../services/dietas.service';

interface Ciudad {
  ciudad: string;
  km: number;
}

@Component({
  selector: 'app-formulario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css',
})
export class Formulario implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dietasService = inject(DietasService);

  formulario!: FormGroup;
  ciudades: Ciudad[] = [];
  horasCalculadas: number = 0;
  fechaMaxima: string = '';

  ngOnInit() {
    this.setFechaMaxima();
    this.cargarCiudades();
    this.inicializarFormulario();
  }

  setFechaMaxima() {
    const hoy = new Date();
    this.fechaMaxima = hoy.toISOString().split('T')[0];
  }

  cargarCiudades() {
    this.http.get<{ ciudades: Ciudad[] }>('/ciudades.json').subscribe({
      next: (data) => {
        this.ciudades = data.ciudades;
      },
      error: (error) => {
        console.error('Error cargando ciudades:', error);
      },
    });
  }

  inicializarFormulario() {
    this.formulario = this.fb.group(
      {
        nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
        dni: ['', [Validators.required, this.validarDNI]],
        horaInicio: ['', Validators.required],
        horaFinal: ['', Validators.required],
        fecha: ['', [Validators.required, this.validarFechaNoFutura]],
        ciudad: ['', Validators.required],
        km: [{ value: '', disabled: true }],
      },
      { validators: this.validarHoras },
    );

    this.formulario.get('horaInicio')?.valueChanges.subscribe(() => {
      this.calcularHoras();
    });

    this.formulario.get('horaFinal')?.valueChanges.subscribe(() => {
      this.calcularHoras();
    });

    this.formulario.get('ciudad')?.valueChanges.subscribe((ciudadNombre) => {
      this.actualizarKm(ciudadNombre);
    });

    this.formulario.get('dni')?.valueChanges.subscribe((value) => {
      if (value) {
        const upperValue = value.toUpperCase();
        if (value !== upperValue) {
          this.formulario.get('dni')?.setValue(upperValue, { emitEvent: false });
        }
      }
    });
  }

  validarHoras(control: AbstractControl): ValidationErrors | null {
    const horaInicio = control.get('horaInicio')?.value;
    const horaFinal = control.get('horaFinal')?.value;

    if (horaInicio && horaFinal && horaFinal <= horaInicio) {
      return { horaFinalMenor: true };
    }

    return null;
  }

  validarDNI(control: AbstractControl): ValidationErrors | null {
    const dni = control.value;
    if (!dni) return null;

    const dniPattern = /^(\d{8})([A-Za-z])$/;
    const match = dni.match(dniPattern);

    if (!match) {
      return { dniInvalido: true };
    }

    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const numero = parseInt(match[1], 10);
    const letra = match[2].toUpperCase();
    const letraCorrecta = letras[numero % 23];

    if (letra !== letraCorrecta) {
      return { letraIncorrecta: true };
    }

    return null;
  }

  validarFechaNoFutura(control: AbstractControl): ValidationErrors | null {
    const fechaStr = control.value;
    if (!fechaStr) return null;

    const fechaPattern = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = fechaStr.match(fechaPattern);

    if (!match) {
      return { formatoInvalido: true };
    }

    const dia = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    const anio = parseInt(match[3], 10);

    if (mes < 1 || mes > 12 || dia < 1 || dia > 31) {
      return { fechaInvalida: true };
    }

    const fecha = new Date(anio, mes - 1, dia);

    if (fecha.getDate() !== dia || fecha.getMonth() !== mes - 1 || fecha.getFullYear() !== anio) {
      return { fechaInvalida: true };
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fecha.setHours(0, 0, 0, 0);

    if (fecha > hoy) {
      return { fechaFutura: true };
    }

    return null;
  }

  calcularHoras() {
    const horaInicio = this.formulario.get('horaInicio')?.value;
    const horaFinal = this.formulario.get('horaFinal')?.value;

    if (horaInicio && horaFinal) {
      const [horaI, minI] = horaInicio.split(':').map(Number);
      const [horaF, minF] = horaFinal.split(':').map(Number);

      const totalMinutosInicio = horaI * 60 + minI;
      const totalMinutosFinal = horaF * 60 + minF;

      const diferenciaMinutos = totalMinutosFinal - totalMinutosInicio;
      this.horasCalculadas = diferenciaMinutos / 60;
    } else {
      this.horasCalculadas = 0;
    }
  }

  actualizarKm(ciudadNombre: string) {
    const ciudadSeleccionada = this.ciudades.find((c) => c.ciudad === ciudadNombre);
    if (ciudadSeleccionada) {
      this.formulario.get('km')?.setValue(ciudadSeleccionada.km);
    }
  }

  onSubmit() {
    if (this.formulario.valid) {
      const formData = this.formulario.getRawValue();

      this.dietasService.agregarRegistro({
        fecha: formData.fecha,
        ciudad: formData.ciudad,
        km: formData.km,
      });

      this.formulario.reset();
      this.horasCalculadas = 0;
    } else {
      this.formulario.markAllAsTouched();
    }
  }
}
