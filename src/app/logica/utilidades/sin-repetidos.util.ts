// Devuelve la lista sin elementos repetidos, en el orden en que aparecieron.
// indexOf da la primera posición de ese valor: si no es la actual, ya apareció antes y se descarta
export function sinRepetidos(lista: string[]) {
  return lista.filter((valor, i, todos) => todos.indexOf(valor) === i);
}
