// actualmente en uso en: auth.service.ts
// el login/password no va acá: lo maneja Supabase Auth (auth.users). Este modelo es el perfil público, con "id" igual al uid que da supabase auth.
// rol usa los valores de ROLES_USUARIO (rol-usuario.ts)

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  color_ojos: string;
  dias_vacaciones_por_anio: number;
  rol: string;
  puntos: number;
  credito: number;
  cupon_primera_compra_usado: boolean;
}
