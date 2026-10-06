// actualmente en uso en: auth.service.ts, admin-empleados.ts, formulario-empleado.ts, beneficios-cuenta.ts
// el login lo maneja Supabase Auth, esto es el perfil (id = el uid de auth)
// rol usa los valores de ROLES_USUARIO (rol-usuario.ts)
// lo del registro (nacimiento, sangre, ojos, vacaciones) es null en los empleados

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  tipo_sangre: string | null;
  color_ojos: string | null;
  dias_vacaciones_por_anio: number | null;
  rol: string;
  puntos: number;
  credito: number;
  cupon_primera_compra_usado: boolean;
}
