// actualmente en uso en: formulario-empleado.ts, usuarios.service.ts
// datos del formulario de un empleado nuevo. La contraseña va a Supabase Auth, el resto se guarda en "usuarios" con rol empleado

export interface EmpleadoNuevo {
  nombre: string;
  apellido: string;
  email: string;
  contrasena: string;
}
