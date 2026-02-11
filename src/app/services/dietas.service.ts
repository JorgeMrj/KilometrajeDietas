import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface RegistroDieta {
  fecha: string;
  ciudad: string;
  km: number;
}

@Injectable({
  providedIn: 'root',
})
export class DietasService {
  private readonly STORAGE_KEY = 'kilometraje_dietas_registros';
  private registrosSubject = new BehaviorSubject<RegistroDieta[]>([]);
  registros$ = this.registrosSubject.asObservable();

  constructor() {
    this.cargarDesdeLocalStorage();
  }

  private cargarDesdeLocalStorage() {
    try {
      const datos = localStorage.getItem(this.STORAGE_KEY);
      if (datos) {
        const registros = JSON.parse(datos);
        this.registrosSubject.next(registros);
      }
    } catch (error) {
      console.error('Error cargando datos del localStorage:', error);
    }
  }

  private guardarEnLocalStorage(registros: RegistroDieta[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registros));
    } catch (error) {
      console.error('Error guardando datos en localStorage:', error);
    }
  }

  agregarRegistro(registro: RegistroDieta) {
    const registrosActuales = this.registrosSubject.value;
    const nuevosRegistros = [...registrosActuales, registro];
    this.registrosSubject.next(nuevosRegistros);
    this.guardarEnLocalStorage(nuevosRegistros);
  }

  eliminarRegistro(index: number) {
    const registrosActuales = this.registrosSubject.value;
    registrosActuales.splice(index, 1);
    const nuevosRegistros = [...registrosActuales];
    this.registrosSubject.next(nuevosRegistros);
    this.guardarEnLocalStorage(nuevosRegistros);
  }

  limpiarTodo() {
    this.registrosSubject.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  obtenerRegistros(): RegistroDieta[] {
    return this.registrosSubject.value;
  }
}
