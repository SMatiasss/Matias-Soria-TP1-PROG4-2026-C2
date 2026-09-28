import { Component, computed, inject } from '@angular/core';
// El pipe currency usa el formato 'es-AR', que se registra con registerLocaleData en app.config.ts
// Si no puedo usar esto, hago una pipe custom?
import { CurrencyPipe } from '@angular/common';
import { Header } from '../../../globales/componentes/header/header';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { AuthService } from '../../../logica/services/auth.service';

// Esto es un placeholder hecho con ia, ignorar completamente.

@Component({
  imports: [Header, EstadoVacio, CurrencyPipe],
  selector: 'app-perfil',
  styleUrl: './perfil.css',
  templateUrl: './perfil.html',
})
export class Perfil {
  private auths = inject(AuthService);

  // Al recargar la página llega un momento después que la pantalla (el guard solo mira la sesión)
  usuario = this.auths.usuarioActual;

  fechaNacimientoTexto = computed(() => {
    const usuario = this.usuario();
    if (!usuario) return '';
    // la base la guarda como AAAA-MM-DD y acá se muestra como DD/MM/AAAA
    const [año, mes, dia] = usuario.fecha_nacimiento.split('-');
    return `${dia}/${mes}/${año}`;
  });
}
