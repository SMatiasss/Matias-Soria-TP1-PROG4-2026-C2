// actualmente en uso en: auth.service.ts, registro.ts
// datos del formulario de registro. La contraseña va a Supabase Auth, el resto se guarda en "usuarios"

export interface UsuarioRegistro {
  email: string;
  contrasena: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  tipoSangre: string;
  colorOjos: string;
  diasVacacionesPorAnio: number;
}
