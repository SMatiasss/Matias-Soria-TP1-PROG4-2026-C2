// "Película" → "Pelicula": recorre el texto letra por letra y reemplaza solo las que tienen tilde o diéresis
export function sinTildes(texto: string) {
  // cada letra con tilde/diéresis y, en la misma posición, su equivalente sin ella
  const conTilde = 'áéíóúÁÉÍÓÚüÜ';
  const sinTilde = 'aeiouAEIOUuU';

  let resultado = '';
  for (const letra of texto) {
    const posicion = conTilde.indexOf(letra);
    resultado += posicion === -1 ? letra : sinTilde[posicion];
  }
  return resultado;
}
