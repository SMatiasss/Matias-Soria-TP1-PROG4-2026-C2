// actualmente en uso en: exportar.util.ts, reservas.ts (también la arma perfil.ts)
// No es una tabla: lo que va escrito en el PDF de la entrada, ya listo para mostrar.
// butacas: "F12" o "R3 (VIP)". candy: "2 × Pochoclos grande". restriccionEdad: null si es apta para todos
export interface EntradaPdf {
  codigo: string;
  pelicula: string;
  restriccionEdad: number | null;
  inicio: string;
  sala: string;
  butacas: string[];
  candy: string[];
}
