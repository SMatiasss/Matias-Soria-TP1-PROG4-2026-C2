# allomund · cine

Trabajo Práctico 1 de Programación IV (2026, 2.º cuatrimestre) · Matías Soria

> **Aviso:** este README fue generado automáticamente con IA a partir del código del proyecto. Va a ser revisado
> y modificado antes de la entrega.

**Deploy:** [Cine Allomund](https://matias-soria-tp-1-prog-4-2026-c2.vercel.app/)

Aplicación web para un cine de un solo edificio con varias salas: cartelera, reseñas, compra de entradas eligiendo
butacas, candy bar, cupones, programa de puntos, crédito por cancelaciones, entrada en PDF con QR, validación del QR
por empleados, alertas de estreno con notificaciones y un panel de administración con reportes y log de actividad.

## Arquitectura

```
Navegador (Angular, PWA)  ──►  Supabase
                               ├── Auth: registro, login y sesión
                               ├── Postgres: tablas con RLS, funciones (comprar, cancelar_compra...) y triggers
                               ├── Storage: los pósters de las películas
                               ├── Realtime: butacas en vivo y log de actividad
                               └── Edge Function avisar-estrenos: manda las notificaciones push
```

- **Frontend:** una SPA en Angular, desplegada en Vercel. No hay un backend propio: la página habla directo con
  Supabase con la clave pública, y lo que tiene que ser seguro (permisos, precios, compras) lo controla la base.
- **Lógica de negocio en la base:** las reglas que no se pueden saltear (cobrar bien, no vender dos veces una butaca,
  no superponer funciones) viven en funciones y triggers de Postgres, no en la página.
- **Comunicación:** casi todo pasa por la librería `supabase-js`. Las "más vendidas" del inicio y la llamada a la Edge
  Function usan `HttpClient`, con un interceptor que les agrega la clave de Supabase.

## Tecnologías

- **Angular 22**: componentes standalone, signals (`signal`, `computed`, `effect`), formularios reactivos
  (`FormBuilder`, `FormArray`, validators propios), rutas con carga diferida (`loadComponent` / `loadChildren`) y
  `title`, guards por rol, una directiva propia, pipes propios, `HttpClient` con un interceptor y service worker
  (`@angular/service-worker`, con `SwPush` para las notificaciones).
- **Supabase**: Auth, Postgres con RLS, Storage, Realtime (`broadcast` y `postgres_changes`) y una Edge Function con
  `web-push`.
- **Librerías**:
  - `date-fns`: cuentas con fechas (semanas, meses, días de cada mes del selector de ruedas).
  - `xlsx` (SheetJS): exportar la facturación a Excel.
  - `jspdf` + `qrcode`: el PDF de la entrada y el QR.
  - `jsqr`: leer el QR con la cámara en Validar QR.

  `xlsx`, `jspdf` y `qrcode` se cargan con `import()` recién al usarlas. Las demás vienen solo con las pantallas que
  las usan, porque cada ruta se carga aparte.

## Cómo correrlo

```bash
npm install
npm start          # ng serve, en http://localhost:4200
npm run build      # build de producción, en dist/
```

- La conexión a Supabase está en `src/environments/` (URL, clave pública y clave pública VAPID). La base (tablas,
  policies, funciones y triggers) ya está creada en Supabase.
- El service worker (instalar la app y las notificaciones) solo se activa en el build de producción, no con `ng serve`.
- El código de la Edge Function está en `supabase/functions/avisar-estrenos/`. Se publica desde el dashboard de
  Supabase, sin verificación de JWT, con los secretos `VAPID_PUBLIC`, `VAPID_SECRET` y `VAPID_MAIL`.

## Roles

| Rol | Qué hace |
|---|---|
| Cliente sin cuenta | Ve la cartelera y compra entradas y candy. |
| Cliente registrado | Además: cupones, puntos (los suma y los canjea), crédito, reseñas, alertas de estreno con notificación y su perfil (compras, películas vistas, canjes, cancelar compras). |
| Empleado | Valida el QR de las entradas y del candy (con la cámara o escribiendo el código). |
| Admin | Películas, funciones y salas, productos y combos, cupones, empleados, reportes y log de actividad. |

## Estructura

```
src/app/
├── pantallas/          una carpeta por pantalla (ruta), cada una con sus componentes propios
│   ├── inicio/         más vendidas, cartelera y próximos estrenos
│   ├── peliculas/      cartelera con buscador y filtro por género, y la ficha de cada película
│   ├── reservas/       la compra en 3 pasos: butacas, candy bar y beneficios
│   ├── cuenta/         login, registro y perfil
│   ├── empleado/       Validar QR
│   ├── admin/          panel con sus 7 secciones
│   └── error/          la página 404
├── globales/           lo que se usa en varias pantallas
│   ├── componentes/    header, mapa de butacas, selector de fecha, alerta, código QR, mensaje de error...
│   ├── directivas/     click afuera (cierra el filtro de géneros)
│   └── pipes/          precio, puntos, fecha, edad mínima y "qué incluye" un combo
└── logica/
    ├── services/       DbService (CRUD genérico) y un servicio por tema para las consultas especiales
    ├── modelos/        las interfaces, una carpeta por tema con su index.ts
    ├── guards/         invitado, sesión, empleado y admin
    ├── interceptors/   agrega la clave de Supabase a los pedidos de HttpClient
    └── utilidades/     funciones sueltas: edad, nombres sin repetir, exportar (PDF, Excel)
supabase/functions/     la Edge Function de las notificaciones
```

## Decisiones técnicas

- **La compra y la cancelación las hace la base, no la página.** Las funciones de Postgres `comprar` y
  `cancelar_compra` (`security definer`) recalculan todo con los precios guardados: preventa, combos con entrada,
  butacas VIP, cupón, crédito y puntos. Guardan el pedido con sus entradas y su candy en una sola transacción: o se
  guarda todo o nada. La página solo muestra una vista previa, y las policies no dejan insertar pedidos directo, así
  que nadie puede pagar menos cambiando el código del navegador.
- **Permisos con RLS.** Cada tabla tiene sus policies, con las funciones `es_admin()` y `es_staff()`. Lo que un
  cliente no puede hacer por sí mismo (crear cuentas de empleados, listarlos, editarlos) pasa por funciones que
  primero revisan que quien llama sea el admin.
- **Sala automática y sin superposiciones.** El admin programa película, días y horario. Un trigger asigna la
  primera sala libre y rechaza cualquier función que quede a menos de 30 minutos de la anterior en la misma sala.
  Otro trigger no deja alargar una película si eso pisa sus funciones.
- **Butacas en tiempo real.** Un trigger en `entradas` avisa por un canal público de Realtime (`funcion:<id>`) cada
  butaca que se vende o se libera, sin decir quién compró. La reserva escucha ese canal mientras está abierta.
- **Puntos y crédito.** Se suma 1 punto por cada peso pagado con plata. Cada función, producto y combo tiene su precio
  en puntos, y en una misma compra se puede pagar una parte con plata y canjear otra con puntos. El crédito de una
  cancelación se usa siempre en la compra siguiente, así no se acumula cancelando una y otra vez.
- **Un solo QR por compra.** El código del pedido sirve para las entradas y para el candy. Cada cosa se marca como
  usada al validarla y no se puede volver a usar.
- **Log de actividad por triggers.** Quién creó una función, cambió un precio (en pesos o en puntos) o validó un QR lo
  anotan triggers de la base: nadie puede escribir en el log a mano. La pantalla del log escucha la tabla con Realtime
  (`postgres_changes`), así lo nuevo aparece sin recargar.
- **Alertas de estreno sin cron.** Al pedir una alerta, el navegador se suscribe a las notificaciones push (`SwPush`,
  claves VAPID). Cada vez que alguien abre la página se llama a la Edge Function `avisar-estrenos`, que busca las
  alertas de películas a las que ya se les abrió la venta, manda el push con `web-push` y las marca como avisadas. La
  notificación llega aunque el usuario no tenga la página abierta, porque la muestra el service worker.
- **Reportes.** Lo vendido del candy se guarda en cada venta con lo que traía el combo en ese momento, así editar un
  combo no cambia los reportes viejos.
- **Fechas sin calendario nativo.** El cliente pidió no usar date-pickers que obliguen a scrollear: hay un selector de
  ruedas propio (`selector-fecha`) que solo deja elegir fechas válidas.
- **Pantallas sin scroll.** Cada pantalla entra en una ventana de escritorio común, y las listas largas scrollean
  adentro de su panel.
- **PWA.** La app se puede instalar y funciona en segundo plano (manifest con el logo de la página y service worker de
  Angular).
