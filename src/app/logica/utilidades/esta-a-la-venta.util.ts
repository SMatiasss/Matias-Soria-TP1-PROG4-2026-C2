// Si ya se pueden comprar entradas de la película: desde el estreno, o los días de preventa antes si la tiene.
// Las fechas son AAAA-MM-DD en hora local. La función comprar de la base usa la misma regla
export function estaALaVenta(
  pelicula: { fecha_estreno: string; preventa_habilitada: boolean; preventa_dias_antes: number | null },
  hoy = new Date().toLocaleDateString('sv-SE'),
) {
  if (hoy >= pelicula.fecha_estreno) return true;
  if (!pelicula.preventa_habilitada) return false;

  const apertura = new Date(`${pelicula.fecha_estreno}T00:00`);
  // si no se configuró, 7 días
  apertura.setDate(apertura.getDate() - (pelicula.preventa_dias_antes ?? 7));
  return hoy >= apertura.toLocaleDateString('sv-SE');
}
