// 9 → "09", 27 → "27". Las fechas AAAA-MM-DD y las horas siempre llevan dos dígitos
export function dosDigitos(numero: number) {
  return numero < 10 ? '0' + numero : String(numero);
}
