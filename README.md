# allomund · cine

Trabajo Práctico 1 de Programación IV (2026, 2.º cuatrimestre) · Matías Soria

**Deploy:** [Cine Allomund](https://matias-soria-tp-1-prog-4-2026-c2.vercel.app/)

Aplicación web para un cine: cartelera, compra de entradas y candy, programa de puntos y panel de administración.

## Arquitectura

```
Navegador (Angular, PWA)  ──►  Supabase
                               ├── Auth: registro, login y sesión
                               ├── Postgres: tablas con RLS, funciones (comprar, cancelar_compra...) y triggers
                               ├── Storage: los pósters de las películas
                               ├── Realtime: butacas en vivo y log de actividad
                               └── Edge Function avisar-estrenos: manda las notificaciones push
```

- **Frontend:** Angular, desplegado en Vercel. No hay un backend propio: la página habla directo con
  Supabase con la clave pública, y lo que tiene que ser seguro (permisos, precios, compras) lo controla la base.
- **Comunicación:** casi todo pasa por la librería `supabase-js`. Las "más vendidas" del inicio y la llamada a la Edge
  Function usan `HttpClient`, con un interceptor que les agrega la clave de Supabase.

```
src/app/
├── globales/      componentes, directivas y pipes que se usan en varias pantallas
├── logica/        servicios, modelos, guards, interceptors y utilidades
└── pantallas/     una carpeta por ruta, cada una con sus componentes propios
```
## Tecnologías

- **Angular 22**
- **Supabase**
- **Librerías**:
  - `date-fns`: cuentas con fechas (semanas, meses, días de cada mes del selector de ruedas).
  - `xlsx` (SheetJS): exportar la facturación a Excel.
  - `jspdf` + `qrcode`: el PDF de la entrada y el QR.
  - `jsqr`: leer el QR con la cámara en Validar QR.
  - `web-push`: mandar las notificaciones desde la Edge Function `avisar-estrenos` (no está en el `package.json`, porque corre en Supabase).

## Cómo correrlo

```bash
npm install
ng serve
```

## Decisiones técnicas

- **La compra y la cancelación las hace la base.** Las funciones `comprar` y `cancelar_compra` de Postgres recalculan
  todo con los precios guardados y guardan todo junto o nada, así nadie paga menos cambiando el código del navegador.
- **Permisos con RLS.** Cada tabla tiene sus policies, y lo que solo puede hacer el admin pasa por funciones que lo
  revisan. Los guards por rol solo ordenan la navegación, lo que protege los datos es la base.
- **Sala automática.** Un trigger asigna la primera sala libre y rechaza funciones a menos de 30 minutos de la anterior.
- **Butacas y log en tiempo real.** Con Realtime de Supabase, sin recargar la página.
- **Log de actividad por triggers.** Lo anota la base, nadie puede escribir en el log a mano.
- **Alertas de estreno.** Al abrir la página se llama a la Edge Function `avisar-estrenos`, que manda los push.
- **Lo vendido guarda su precio.** Cada entrada y cada producto del candy se guardan con lo que costaron, así cambiar un
  precio o un combo no cambia el historial ni los reportes.
- **Un solo QR por compra.** Es el código del pedido, y cada entrada y cada producto se marcan como usados por separado.
- **Alta de empleados.** Para crear un empleado se usa un cliente de Supabase aparte, porque el registro deja
  iniciada la sesión con la cuenta nueva y el admin perdería la suya.
- **Selector de fechas propio.** Unas ruedas que solo dejan elegir fechas válidas, en vez del calendario del navegador.
