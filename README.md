# allomund · cine

Trabajo Práctico 1 de Programación IV (2026, 2.º cuatrimestre) · Matías Soria

> **Aviso:** este README fue generado automáticamente con IA a partir del código del proyecto. Va a ser revisado
> y modificado antes de la entrega.

**Deploy:** [Cine Allomund](https://matias-soria-tp-1-prog-4-2026-c2.vercel.app/)

Aplicación web para un cine de un solo edificio con varias salas: cartelera, reseñas, compra de entradas eligiendo
butacas, candy bar, cupones, programa de puntos, crédito por cancelaciones, entrada en PDF con QR, validación del QR
por empleados y un panel de administración con reportes y log de actividad.

## Tecnologías

- **Angular 22**: componentes standalone, signals (`signal`, `computed`, `effect`), formularios reactivos, rutas con
  carga diferida (`loadComponent` / `loadChildren`), guards por rol y HttpClient con un interceptor (más vendidas del inicio).
- **Supabase**: Auth (registro e inicio de sesión), Postgres con RLS, Storage (pósters) y Realtime (butacas y log de actividad).
- **Librerías**, todas cargadas con `import()` recién cuando se usan, para no agrandar la carga inicial:
  - `date-fns`: cuentas con fechas (semanas, meses, días de cada mes del selector de ruedas).
  - `xlsx` (SheetJS): exportar la facturación a Excel.
  - `jspdf` + `qrcode`: el PDF de la entrada con su QR.
  - `jsqr`: leer el QR con la cámara en Validar QR.

## Roles

| Rol | Qué hace |
|---|---|
| Cliente sin cuenta | Ve la cartelera y compra entradas y candy. |
| Cliente registrado | Además: cupones, puntos (los suma y los canjea), crédito, reseñas, alertas de estreno y su perfil (compras, películas vistas, canjes, cancelar compras). |
| Empleado | Valida el QR de las entradas y del candy (con la cámara o escribiendo el código). |
| Admin | Películas, funciones y salas, productos y combos, cupones, empleados, reportes y log de actividad. |

## Estructura

```
src/app/
├── pantallas/          una carpeta por pantalla (ruta), cada una con sus componentes propios
│   ├── inicio/         estrenos, próximamente y las 3 más vendidas
│   ├── peliculas/      cartelera con buscador y filtro por género, y la ficha de cada película
│   ├── reservas/       la compra en 3 pasos: butacas, candy bar y beneficios
│   ├── cuenta/         login, registro y perfil
│   ├── empleado/       Validar QR
│   └── admin/          panel con sus 7 secciones
├── globales/           lo que se usa en varias pantallas
│   ├── componentes/    header, mapa de butacas, selector de fecha, alerta, código QR, gráfico de barras...
│   └── pipes/          precio, puntos, fecha, edad mínima y "qué incluye" un combo
└── logica/
    ├── services/       DbService (CRUD genérico) y un servicio por tema para las consultas especiales
    ├── modelos/        las interfaces, una carpeta por tema con su index.ts
    ├── guards/         invitado, sesión, empleado y admin
    └── utilidades/     funciones sueltas: edad, nombres sin repetir, exportar (PDF, Excel)
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
- **Log de actividad por triggers.** Quién creó una función, cambió un precio o validó un QR lo anotan triggers de la
  base: nadie puede escribir en el log a mano. La pantalla del log escucha la tabla con Realtime (`postgres_changes`),
  así lo nuevo aparece sin recargar.
- **Reportes.** Lo vendido del candy se guarda en cada venta con lo que traía el combo en ese momento, así editar un
  combo no cambia los reportes viejos.
- **Fechas sin calendario nativo.** El cliente pidió no usar date-pickers que obliguen a scrollear: hay un selector de
  ruedas propio (`selector-fecha`) que solo deja elegir fechas válidas.
- **Pantallas sin scroll.** Cada pantalla entra en una ventana de escritorio común, y las listas largas scrollean
  adentro de su panel.
- **PWA.** La app se puede instalar y funciona en segundo plano (manifest con el logo de la página y service worker de Angular).

## Pendiente

- Avisar al usuario cuando abre la venta de una película con alerta de estreno (la alerta ya se guarda).
