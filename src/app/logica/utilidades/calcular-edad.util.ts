// Años cumplidos hasta hoy. La fecha llega como AAAA-MM-DD, así la guarda la base y la arma el selector de fecha
export function calcularEdad(fechaNacimiento: string) {
  const hoy = new Date();
  const nacimiento = new Date(`${fechaNacimiento}T00:00`);
  const cumpleEsteAño = new Date(hoy.getFullYear(), nacimiento.getMonth(), nacimiento.getDate());

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  // si este año todavía no llegó el cumpleaños, tiene uno menos
  if (hoy < cumpleEsteAño) edad = edad - 1;
  return edad;
}
