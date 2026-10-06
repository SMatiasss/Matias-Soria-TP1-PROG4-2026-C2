import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectorFecha } from '../../../../../globales/componentes/selector-fecha/selector-fecha';
import { Badge } from '../../../../../globales/componentes/badge/badge';
import { Alerta } from '../../../../../globales/componentes/alerta/alerta';
import { DbService } from '../../../../../logica/services/db.service';
import { StorageService } from '../../../../../logica/services/storage.service';
import { PeliculasService } from '../../../../../logica/services/peliculas.service';
import { Pelicula, PeliculaFormulario, RESTRICCIONES_EDAD } from '../../../../../logica/modelos/peliculas';
import { nombreEnLista } from '../../../../../logica/utilidades/nombre-en-lista.util';
// date-fns, la misma que usa el selector de fecha: addYears suma o resta años,
// format arma el texto "AAAA-MM-DD" y parseISO lo vuelve a leer como fecha local
import { addYears, format, parseISO } from 'date-fns';

// la preventa solo sirve si el estreno es después de hoy (las fechas AAAA-MM-DD se comparan como texto)
function estrenaDespuesDeHoy(fecha: string | null) {
  if (!fecha) return false;
  return fecha > format(new Date(), 'yyyy-MM-dd');
}

// con preventa (y el estreno todavía no pasó) tiene que tener precio y días
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
  private db = inject(DbService);
  private stg = inject(StorageService);
  private ps = inject(PeliculasService);

  // null = película nueva
  pelicula = input<Pelicula | null>(null);
  // los de la tabla generos, para sugerirlos mientras se escribe
  generosExistentes = input<string[]>([]);
  // avisan a la lista para que cierre el formulario (y recargue, si se guardó)
  cancelado = output<void>();
  guardado = output<void>();

  imagen = signal<File | null>(null);
  // la imagen del recuadro: la recién elegida o la que ya tenía. createObjectURL la muestra antes de subirla
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
  // y dejan elegir un año para cada lado de esa fecha
  fechaBaseEstreno = computed(() => addYears(parseISO(this.fechaInicial()), -1));

  formulario = new FormGroup(
    {
      titulo: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
      sinopsis: new FormControl('', [Validators.required, Validators.pattern(/\S/)]),
      duracion_minutos: new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
      // los elegidos, se agregan y se sacan con agregarGenero y quitarGenero
      generos: new FormControl<string[]>([], Validators.required),
      restriccion_edad: new FormControl<number | null>(null),
      // arranca en la fecha que muestran las ruedas (ngOnInit) y la cambia el selector al moverlas
      fecha_estreno: new FormControl<string | null>(null),
      visible: new FormControl(true),
      preventa_habilitada: new FormControl(false),
      preventa_precio: new FormControl<number | null>(null),
      preventa_dias_antes: new FormControl<number | null>(7),
    },
    { validators: preventaCompletaValidator },
  );

  // el estreno arranca en la fecha que muestran las ruedas (hoy si es nueva), así se guarda sin moverlas.
  // Al editar arranca con los datos de la película
  ngOnInit() {
    this.formulario.controls.fecha_estreno.setValue(this.fechaInicial());
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

  // si ya hay un género igual (sin contar mayúsculas ni tildes) se usa ese, si no va con mayúscula al principio
  agregarGenero(campo: HTMLInputElement) {
    // sin espacios de más: la tabla generos acepta uno solo entre palabras
    const escrito = campo.value.trim().replace(/\s+/g, ' ');
    if (!escrito) return;
    // la tabla generos solo acepta letras y espacios: con otra cosa fallaría todo el guardado
    const soloLetras = /^[a-záéíóúüñ ]+$/i;
    this.errorGenero.set(!soloLetras.test(escrito));
    if (this.errorGenero()) return;
    campo.value = '';

    const elegidos = this.formulario.controls.generos.value as string[];
    const genero = nombreEnLista(escrito, [...this.generosExistentes(), ...elegidos]);

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

    // los géneros que todavía no están en la tabla se agregan antes, para que aparezcan como sugerencia
    const nuevos = valores.generos.filter((genero) => !this.generosExistentes().includes(genero));
    if (nuevos.length && (await this.ps.agregarGeneros(nuevos))) {
      this.guardando.set(false);
      this.error.set('No se pudieron guardar los géneros nuevos. Intentá de nuevo.');
      return;
    }

    const error = await this.db.guardar('peliculas', editada ? editada.id : null, datos);

    this.guardando.set(false);
    if (error) {
      // P0001: el mensaje de un trigger (ej: la duración nueva pisa otra función), si no uno general
      if (error.code === 'P0001') this.error.set(error.message);
      else this.error.set('No se pudo guardar la película. Revisá los datos e intentá de nuevo.');
      return;
    }

    this.guardado.emit();
  }
}
