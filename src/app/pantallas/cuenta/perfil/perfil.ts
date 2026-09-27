import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, registerLocaleData } from '@angular/common';
import localeEsAr from '@angular/common/locales/es-AR';
import { Header } from '../../../globales/componentes/header/header';
import { EstadoVacio } from '../../../globales/componentes/estado-vacio/estado-vacio';
import { AuthService } from '../../../logica/services/auth.service';

// Esto es un placeholder hecho con ia, ignorar completamente.



// Formato argentino para el pipe currency del crédito (ej: "$ 4.500")
registerLocaleData(localeEsAr);

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
    return usuario ? new Date(`${usuario.fecha_nacimiento}T00:00`).toLocaleDateString('es-AR') : '';
  });
}
