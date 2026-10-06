import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

// Desplegable de una lista cerrada con su etiqueta (tipo de sangre, color de ojos). Los errores van adentro, con ng-content
@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-campo-seleccion',
  styleUrl: './campo-seleccion.css',
  templateUrl: './campo-seleccion.html',
})
export class CampoSeleccion {
  etiqueta = input.required<string>();
  idCampo = input.required<string>(); // une el label con el select: tocar la etiqueta abre el desplegable
  opciones = input.required<string[]>();
  control = input.required<FormControl<string | null>>(); // el campo del formulario del registro
}
