import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectorFecha } from '../../../../../globales/componentes/selector-fecha/selector-fecha';
import { Badge } from '../../../../../globales/componentes/badge/badge';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { PeliculasService } from '../../../../../logica/services/peliculas.service';
import { StorageService } from '../../../../../logica/services/storage.service';
import { Pelicula, PeliculaFormulario, RESTRICCIONES_EDAD } from '../../../../../logica/modelos/peliculas';
import { sinTildes } from '../../../../../logica/utilidades/sin-tildes.util';
// date-fns, la misma que usa el selector de fecha: addYears suma o resta años,
// format arma el texto "AAAA-MM-DD" y parseISO lo vuelve a leer como fecha local
import { addYears, format, parseISO } from 'date-fns';

// La preventa solo sirve si la película todavía no se estrenó: el estreno tiene que ser después de hoy.
// Las fechas "AAAA-MM-DD" se pueden comparar como texto: "2026-10-04" > "2026-10-03"
function estrenaDespuesDeHoy(fecha: string | null) {
  if (!fecha) return false;
  return fecha > format(new Date(), 'yyyy-MM-dd');
}

// Con la preventa habilitada (y un estreno que todavía no pasó), tiene que tener precio y cuántos días antes abre
function preventaCompletaValidator(grupo: AbstractControl) {
  if (!grupo.get('preventa_habilitada')?.value || !estrenaDespuesDeHoy(grupo.get('fecha_estreno')?.value)) return null;
  const precio = grupo.get('preventa_precio')?.value;
  const dias = grupo.get('preventa_dias_antes')?.value;
  return precio > 0 && dias > 0 ? null : { preventaIncompleta: true };
}

@Component({
  imports: [SelectorFecha, Badge, Alerta, ReactiveFormsModule],
  selector: 'app-formulario-pelicula',
  styleUrl: './formulario-pelicula.css',
  templateUrl: './formulario-pelicula.html',
})
export class FormularioPelicula implements OnInit {
  private ps = inject(PeliculasService);
  private stg = inject(StorageService);

  // null = película nueva
  pelicula = input<Pelicula | null>(null);
  // los de la tabla generos, para sugerirlos mientras se escribe
  generosExistentes = input<string[]>([]);
  // avisan a la lista para que cierre el formulario (y recargue, si se guardó)
  cancelado = output<void>();
  guardado = output<void>();

  imagen = signal<File | null>(null);
  // Lo que se ve en el recuadro de la imagen: la recién elegida o, al editar, la que ya tenía.
  // createObjectURL es del navegador: arma una dirección temporal para mostrar el archivo antes de subirlo
  vistaPrevia = computed(() => {
    const archivo = this.imagen();
    if (archivo) return URL.createObjectURL(archivo);
    return this.pelicula()?.imagen_url ?? null;
  });
  intentoGuardar = signal(false);
  guardando = signal(false);
  // si no se pudo guardar, se muestra en un modal
  error = signal<string | null>(null);
  // el género escrito tiene algo que la tabla generos no acepta (números o símbolos)
  errorGenero = signal(false);

  readonly restricciones = [RESTRICCIONES_EDAD.TRECE, RESTRICCIONES_EDAD.DIECIOCHO];

  // Las ruedas del estreno arrancan en la fecha que ya tiene (al editar) o en hoy (si es nueva)
  fechaInicial = computed(() => {
    const pelicula = this.pelicula();
    if (pelicula) return pelicula.fecha_estreno;
    return format(new Date(), 'yyyy-MM-dd');
  });
  // y dejan elegir de 1 año antes a 1 año después de esa fecha: el rango del selector empieza 1 año antes y dura 2
  fechaBaseEstreno = computed(() => addYears(parseISO(this.fechaInicial()), -1));

  formulario = new FormGroup(
    {
      titulo: new FormControl('', Validators.required),
      sinopsis: new FormControl('', Validators.required),
      duracion_minutos: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      // los elegidos, se agregan y se sacan con agregarGenero y quitarGenero
      generos: new FormControl<string[]>([], Validators.required),
      restriccion_edad: new FormControl<number | null>(null),
      // la llena el selector de fecha
      fecha_estreno: new FormControl<string | null>(null, Validators.required),
      visible: new FormControl(true),
      preventa_habilitada: new FormControl(false),
      preventa_precio: new FormControl<number | null>(null),
      preventa_dias_antes: new FormControl<number | null>(7),
    },
    { validators: preventaCompletaValidator },
  );

  // al editar, el formulario arranca con los datos de la película
  ngOnInit() {
    const pelicula = this.pelicula();
    if (!pelicula) return;
    this.formulario.reset(pelicula);
    // sin preventa los días se guardan vacíos: si la habilita, arranca en 7 como en una película nueva
    if (!pelicula.preventa_dias_antes) this.formulario.controls.preventa_dias_antes.setValue(7);
  }

  // el template no puede usar la función de arriba directamente, por eso este método
  puedeTenerPreventa() {
    return estrenaDespuesDeHoy(this.formulario.controls.fecha_estreno.value);
  }

  // Si ya hay un género igual, sin importar mayúsculas ni tildes, se usa ese. Uno nuevo va con la primera letra en mayúscula.
  // La base hace lo mismo al guardar (compara con clave_genero y crea los nuevos), acá es para ver el nombre final antes
  agregarGenero(campo: HTMLInputElement) {
    const escrito = campo.value.trim();
    if (!escrito) return;
    // la tabla generos solo acepta letras y espacios: con otra cosa fallaría todo el guardado
    const soloLetras = /^[a-záéíóúüñ ]+$/i;
    this.errorGenero.set(!soloLetras.test(escrito));
    if (this.errorGenero()) return;
    campo.value = '';

    const elegidos = this.formulario.controls.generos.value as string[];
    const comparable = (genero: string) => sinTildes(genero).toLowerCase();
    const existente = [...this.generosExistentes(), ...elegidos].find((genero) => comparable(genero) === comparable(escrito));
    const genero = existente ? existente : escrito[0].toUpperCase() + escrito.slice(1).toLowerCase();

    if (!elegidos.includes(genero)) this.formulario.controls.generos.setValue([...elegidos, genero]);
  }

  quitarGenero(genero: string) {
    const elegidos = this.formulario.controls.generos.value as string[];
    this.formulario.controls.generos.setValue(elegidos.filter((elegido) => elegido !== genero));
  }

  alElegirImagen(evento: Event) {
    const archivo = (evento.target as HTMLInputElement).files?.[0];
    this.imagen.set(archivo ?? null);
  }

  async guardar() {
    const editada = this.pelicula();
    this.intentoGuardar.set(true);
    // la imagen es obligatoria al crear, al editar se puede dejar la que ya tenía
    if (this.formulario.invalid || (!editada && !this.imagen())) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    // primero se sube la imagen nueva (si eligió una) para tener su URL
    let imagenUrl = editada ? editada.imagen_url : '';
    const archivo = this.imagen();
    if (archivo) {
      const extension = archivo.name.split('.').pop();
      const url = await this.stg.subirArchivo(archivo, `peliculas/${Date.now()}.${extension}`);
      if (!url) {
        this.guardando.set(false);
        this.error.set('No se pudo subir la imagen. Intentá de nuevo.');
        return;
      }
      imagenUrl = url;
    }

    const valores = this.formulario.value as PeliculaFormulario;
    // una película que ya se estrenó no puede tener preventa, aunque la tuviera tildada de antes
    const conPreventa = valores.preventa_habilitada && this.puedeTenerPreventa();
    const datos = {
      ...valores,
      imagen_url: imagenUrl,
      preventa_habilitada: conPreventa,
      // sin preventa no se guardan precio ni días
      preventa_precio: conPreventa ? valores.preventa_precio : null,
      preventa_dias_antes: conPreventa ? valores.preventa_dias_antes : null,
    };

    const error = await this.ps.guardarPelicula(editada ? editada.id : null, datos);

    this.guardando.set(false);
    if (error) {
      // P0001 es el código de los "raise exception" de nuestros triggers (ej: la duración nueva pisa otra función).
      // Ese mensaje ya está escrito para el admin. Cualquier otro error es técnico, por eso va uno general
      if (error.code === 'P0001') this.error.set(error.message);
      else this.error.set('No se pudo guardar la película. Revisá los datos e intentá de nuevo.');
      return;
    }

    this.guardado.emit();
  }
}
