# Requisitos del TP

Resumen de requisitos.

## El cine y las salas

- Un solo edificio con varias salas.
- Todas las salas iguales: 20 filas con letras y 3 bloques de 4, 20 y 4 butacas.
- Las filas J y K se reemplazan por una fila para personas con discapacidad, de 2, 10 y 2 butacas, resaltada en el mapa.
- Las últimas 3 filas (R, S y T) son VIP: más caras y marcadas distinto en el mapa.

## Películas y funciones

- Cada película tiene duración, imagen, nombre y sinopsis, uno o varios géneros, y puede tener restricción de edad
  (+13, +18 o ninguna).
- El admin elige qué películas aparecen, en qué días y horarios, en qué formato (2D, 3D, 4D o 5D) y en qué idioma
  (castellano o subtitulada).
- Se programa con película, días de la semana y horario (ej: lunes, martes y viernes a las 18 h), y el sistema asigna la
  sala solo.
- Nunca dos funciones en la misma sala al mismo tiempo, y siempre media hora libre entre una y otra.

## Clientes

- Registro con mail, nombre, apellido, fecha de nacimiento, tipo de sangre, color de ojos y días de vacaciones por año.
- También se puede comprar sin registrarse.
- La página principal muestra primero las 3 películas más vendidas.
- Listado de películas con buscador que filtra por género.
- Reseñas: cada persona califica con estrellas y deja un comentario corto, visibles antes de comprar, con el promedio de
  la película.
- Sección "Próximamente" con los estrenos de las próximas semanas, con una alerta para recibir una notificación cuando
  se abra la venta.
- Perfil con los puntos, el historial de canjes, el crédito y "Mis películas": todo lo que vio, con póster, fecha y su
  calificación.

## Compra

- Elegir butacas en un mapa que muestra en tiempo real las que ya ocupó otra compra.
- Si la butaca es VIP, que quede claro antes de pagar.
- Sumar productos del candy bar (pochoclos, bebidas, etc.) y combos (entrada, pochoclos y bebida a precio fijo), con los
  combos destacados.
- Descuentos:
  - Cupón del 20% en la primera compra para los registrados, con un porcentaje que el admin puede cambiar.
  - Cupones solo para mayores de 50.
- Puntos para los registrados: 1 por cada peso gastado, canjeables por entradas o candy. No se pueden pasar a otro
  usuario.
- Preventa: la venta abre 7 días antes del estreno con un precio especial, que después vuelve al normal. Se configura
  película por película.
- Restricción de edad: un menor no puede comprar entradas de una película +13 o +18, y la entrada aclara que tiene que ir
  con un adulto.
- Al comprar se genera un PDF con los datos de la entrada y un QR. El mismo QR sirve para retirar el candy.
- Cancelar la compra hasta 2 horas antes de la función: no se devuelve plata sino crédito, que se ve en el perfil y se
  usa junto con otros medios de pago.

## Empleados

- Cuentas de empleado para escanear el QR y validar las entradas en la sala y el candy en el mostrador.
- Si el lector no anda, el código se escribe a mano.
- Una vez validada la entrada o entregada la comida, el QR deja de servir.

## Administración

- Un usuario admin controla todo: salas, funciones, butacas, películas, productos con sus categorías, combos, cupones y
  cuánto cuesta cada canje en puntos.
- Reportes:
  - Facturación y entradas vendidas por día, exportable a PDF y a Excel.
  - Gráfico de las películas más vistas por semana y por mes.
  - El producto del candy que más se vende.
- Log de actividad con fecha y hora: quién creó cada función, quién cambió un precio y quién validó un QR.

## Usabilidad

- Pantallas fáciles de usar para clientes y empleados.
- Una forma de cargar fechas y horas mejor que un calendario donde hay que buscar mucho.