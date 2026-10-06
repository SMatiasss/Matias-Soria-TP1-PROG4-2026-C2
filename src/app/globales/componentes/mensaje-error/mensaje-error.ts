import { Component, input } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

// Un mensaje de error de un campo: se muestra si el control tiene ese error. Sirve para cualquier error y formulario:
// <app-mensaje-error [errores]="control.errors" error="required" mensaje="Campo obligatorio" />
@Component({
  imports: [],
  selector: 'app-mensaje-error',
  templateUrl: './mensaje-error.html',
})
export class MensajeError {
  // los errores del control: control.errors
  errores = input<ValidationErrors | null>(null);
  // cuál error mira: 'required', 'email', 'minlength'...
  error = input.required<string>();
  mensaje = input.required<string>();
}
