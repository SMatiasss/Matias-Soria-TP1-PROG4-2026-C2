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
- **APIs públicas**:
  - Feriados de Argentina (`api.argentinadatos.com`, sin clave): la ficha de la película marca "Feriado" en los días de
    función. Se pide con `HttpClient`.
  - Google Fonts: la letra Poppins de toda la página.

## Cómo correrlo

```bash
npm install
ng serve
```

## Decisiones técnicas

- **Sala automática.** Un trigger asigna la primera sala libre y rechaza funciones a menos de 30 minutos de la anterior.
- **Un solo QR por compra.** Es el código del pedido, y cada entrada y cada producto se marcan como usados por separado.
- **Selector de fechas propio.** Unas ruedas que solo dejan elegir fechas válidas, en vez del calendario del navegador.
- **Log de actividad por triggers.** Lo anota la base, así nadie lo escribe a mano, y aparece sin recargar (Realtime).
- **Lo vendido guarda su precio.** Así cambiar un precio o un combo no cambia el historial ni los reportes.
- **Alta de empleados.** Con un cliente de Supabase aparte, porque el registro inicia sesión con la cuenta nueva y el
  admin perdería la suya.
- **Permisos con RLS.** Cada tabla tiene sus policies y lo que es solo del admin pasa por funciones que lo revisan. Los
  guards solo ordenan la navegación: lo que protege los datos es la base.
- **La compra y la cancelación las hace la base.** `comprar` y `cancelar_compra` recalculan con los precios guardados y
  guardan todo junto o nada, así nadie paga menos tocando el navegador.
- **Crédito automático.** Si hay crédito, se usa en cada compra hasta que se termine y el resto se paga con plata. Así
  se combina con el otro medio de pago, como pidió el cliente, y no queda saldo sin usar.
- **Butacas en tiempo real al comprar.** Una butaca se marca ocupada cuando se compra, no cuando alguien la elige: si
  no, cualquiera podría tomar todas sin comprar. Si dos eligen la misma, se la queda el primero que paga.
- **Puntos al validar.** Se suman con la primera validación del QR, no al comprar. Como una compra con algo validado ya
  no se puede cancelar, nadie puede gastar sus puntos y después cancelarla. El que compra y no va no suma.
- **Alertas de estreno sin tarea programada.** Cada vez que alguien abre la página, se llama a la Edge Function
  `avisar-estrenos`, que manda los push de las películas que ya abrieron la venta. Cada alerta se manda una sola vez.
  Al que pidió el aviso le llega aunque no tenga la página abierta, y el aviso sale con la visita de cualquiera.