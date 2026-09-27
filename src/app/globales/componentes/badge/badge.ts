import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-badge',
  styleUrl: './badge.css',
  templateUrl: './badge.html',
})
export class Badge {
  texto = input.required<string>();
  
  // 'neutro' (fondo oscuro), 'rojo' (ej: restricción de edad) o 'dorado' (ej: VIP, combos, preventa)
  color = input('neutro');
}
