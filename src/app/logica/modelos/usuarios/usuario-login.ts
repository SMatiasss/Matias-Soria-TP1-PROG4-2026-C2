// actualmente en uso en: auth.service.ts, login.ts
// datos del formulario de login. La contraseña no se guarda en "usuarios": la maneja Supabase Auth

export interface UsuarioLogin {
  email: string;
  contrasena: string;
}
