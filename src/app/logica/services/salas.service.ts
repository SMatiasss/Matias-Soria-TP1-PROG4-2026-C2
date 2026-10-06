import { inject, Service } from '@angular/core';
import { SupabaseService } from './supabase';
import { TIPOS_BUTACA } from '../modelos/salas';

// Todas las salas tienen la misma forma: filas de la A a la T, cada una con 4·20·4 butacas (28).
// La J y la K se sacaron para dejar una sola fila accesible de 2·10·2 (14), que quedó como J. La R, la S y la T son VIP
const FILAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
const FILA_ACCESIBLE = 'J';
const FILAS_VIP = ['R', 'S', 'T'];

@Service()
export class SalasService {
  private sup = inject(SupabaseService);

  // Crea una sala con todas sus butacas. Devuelve el error de la base (o null si salió bien)
  async crearSala(nombre: string) {
    // con .select() la base devuelve la sala creada, y así tengo su id para las butacas
    const sala = await this.sup.Sup.from('salas').insert({ nombre }).select('id');
    if (sala.error) {
      console.error('No se pudo crear la sala', sala.error);
      return sala.error;
    }

    const butacas = await this.sup.Sup.from('butacas').insert(this.butacasDeSala(sala.data[0].id));
    if (butacas.error) {
      console.error('No se pudieron crear las butacas', butacas.error);
      // Son dos pasos y no uno: si fallan las butacas, borro la sala para que no quede una vacía.
      // Lo prolijo sería una función en la base que haga las dos cosas juntas (como guardar_combo), pero para esto alcanza
      await this.sup.Sup.from('salas').delete().eq('id', sala.data[0].id);
    }
    return butacas.error;
  }

  // Las 518 butacas de una sala nueva, con la forma de arriba
  private butacasDeSala(salaId: string) {
    const butacas = [];
    for (const fila of FILAS) {
      let tipo = TIPOS_BUTACA.NORMAL;
      let cantidad = 28;
      if (fila === FILA_ACCESIBLE) {
        tipo = TIPOS_BUTACA.ACCESIBLE;
        cantidad = 14;
      }
      if (FILAS_VIP.includes(fila)) tipo = TIPOS_BUTACA.VIP;

      for (let columna = 1; columna <= cantidad; columna++) {
        butacas.push({ sala_id: salaId, fila, columna, tipo });
      }
    }
    return butacas;
  }
}
