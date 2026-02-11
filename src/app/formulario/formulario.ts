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
    const nombreGuardado = localStorage.getItem('nombreUsuario') || '';
    const dniGuardado = localStorage.getItem('dniUsuario') || '';
    const horaInicioGuardada = localStorage.getItem('horaInicioUsuario') || '';
    const horaFinalGuardada = localStorage.getItem('horaFinalUsuario') || '';

    this.formulario = this.fb.group(
      {
        nombre: [
          nombreGuardado,
          [Validators.required, Validators.minLength(2), Validators.maxLength(100)],
        ],
        dni: [dniGuardado, [Validators.required, this.validarDNI]],
        horaInicio: [horaInicioGuardada, Validators.required],
        horaFinal: [horaFinalGuardada, Validators.required],
        fecha: ['', [Validators.required, this.validarFechaNoFutura]],
        ciudad: ['', Validators.required],
        km: [{ value: '', disabled: true }],
      },
      { validators: this.validarHoras },
    );

    this.formulario.get('nombre')?.valueChanges.subscribe((value) => {
      localStorage.setItem('nombreUsuario', value || '');
    });

    this.formulario.get('dni')?.valueChanges.subscribe((value) => {
      if (value) {
        const upperValue = value.toUpperCase();
        if (value !== upperValue) {
          this.formulario.get('dni')?.setValue(upperValue, { emitEvent: false });
        } else {
          localStorage.setItem('dniUsuario', value);
        }
      } else {
        localStorage.setItem('dniUsuario', '');
      }
    });

    this.formulario.get('horaInicio')?.valueChanges.subscribe((value) => {
      localStorage.setItem('horaInicioUsuario', value || '');
      this.calcularHoras();
    });

    this.formulario.get('horaFinal')?.valueChanges.subscribe((value) => {
      localStorage.setItem('horaFinalUsuario', value || '');
      this.calcularHoras();
    });

    this.formulario.get('ciudad')?.valueChanges.subscribe((ciudadNombre) => {
      this.actualizarKm(ciudadNombre);
    });

    if (horaInicioGuardada && horaFinalGuardada) {
      this.calcularHoras();
    }
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
    const valor = control.value;
    if (!valor) return null;

    const valorLimpio = valor.toUpperCase().trim();
    const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';

    const dniPattern = /^(\d{8})([A-Z])$/;
    const dniMatch = valorLimpio.match(dniPattern);

    if (dniMatch) {
      const numero = parseInt(dniMatch[1], 10);
      const letra = dniMatch[2];
      const letraCorrecta = letras[numero % 23];

      if (letra !== letraCorrecta) {
        return { letraIncorrecta: true };
      }
      return null;
    }

    const niePattern = /^([XYZ])(\d{7})([A-Z])$/;
    const nieMatch = valorLimpio.match(niePattern);

    if (nieMatch) {
      const primeraLetra = nieMatch[1];
      const digitos = nieMatch[2];
      const letra = nieMatch[3];

      const prefijo = primeraLetra === 'X' ? '0' : primeraLetra === 'Y' ? '1' : '2';
      const numeroCompleto = parseInt(prefijo + digitos, 10);
      const letraCorrecta = letras[numeroCompleto % 23];

      if (letra !== letraCorrecta) {
        return { letraIncorrecta: true };
      }
      return null;
    }

    return { dniInvalido: true };
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

    if (fecha >= hoy) {
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

      this.formulario.patchValue({
        fecha: '',
        ciudad: '',
        km: '',
      });

      this.formulario.get('fecha')?.markAsPristine();
      this.formulario.get('fecha')?.markAsUntouched();
      this.formulario.get('ciudad')?.markAsPristine();
      this.formulario.get('ciudad')?.markAsUntouched();
    } else {
      this.formulario.markAllAsTouched();
    }
  }

  limpiarFormulario() {
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem('dniUsuario');
    localStorage.removeItem('horaInicioUsuario');
    localStorage.removeItem('horaFinalUsuario');

    this.formulario.reset();
    this.horasCalculadas = 0;
  }
}
