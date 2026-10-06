// actualmente en uso en: admin-log-actividad.ts, log-actividad.service.ts

export interface RegistroActividad {
  id: string;
  email_actor: string;
  accion: string;
  detalle: string;
  fecha_hora: string;
}
