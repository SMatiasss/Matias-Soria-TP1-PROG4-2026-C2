// actualmente en uso en: formulario-combo.ts, candy.service.ts
// Lo que carga el admin en el formulario de un combo. No es una tabla:
// se guarda con la función guardar_combo de la base, que reparte los datos entre combos y combo_productos

// un producto elegido para el combo y cuántos trae
export interface ProductoElegido {
  producto_id: string;
  cantidad: number;
}

export interface ComboFormulario {
  nombre: string;
  precio: number;
  precio_puntos: number | null;
  incluye_entrada: boolean;
  disponible: boolean;
  productos: ProductoElegido[];
}
