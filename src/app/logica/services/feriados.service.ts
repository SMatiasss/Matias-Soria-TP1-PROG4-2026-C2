import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Feriado } from '../modelos/feriados';

// Los feriados de Argentina, de una API pública de internet (sin clave)
@Service()
export class FeriadosService {
  private http = inject(HttpClient);

  traerFeriados(año: number) {
    return this.http.get<Feriado[]>(`https://api.argentinadatos.com/v1/feriados/${año}`);
  }
}
