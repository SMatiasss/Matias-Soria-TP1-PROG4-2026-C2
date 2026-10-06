// actualmente en uso en: admin-log-actividad.ts

export interface RegistroActividad {
  id: string;
  email_actor: string;
  accion: string;
  detalle: string;
  fecha_hora: string;
}
