import { Service, inject, signal } from '@angular/core';
import { User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { DbService } from './db.service';
import { Usuario } from '../modelos/usuarios/usuario';
import { UsuarioLogin } from '../modelos/usuarios/usuario-login';
import { UsuarioRegistro } from '../modelos/usuarios/usuario-registro';

@Service()
export class AuthService {
  private sup = inject(SupabaseService);
  private db = inject(DbService);

  usuarioActual = signal<Usuario | null>(null);

  constructor() {
    this.sup.Auth.onAuthStateChange((evento, sesion) => {
      if (evento === 'SIGNED_IN' || evento === 'INITIAL_SESSION') {
        if (sesion?.user) this.cargarPerfil(sesion.user);
      } else if (evento === 'SIGNED_OUT') {
        this.usuarioActual.set(null);
      }
    });
  }

  // Si el perfil no existe (primer login después del registro) se crea con los datos que mandó signUp.
  // Así funciona tenga o no activada la confirmación por email en Supabase.
  private async cargarPerfil(usuario: User) {
    const perfil = await this.db.findById('usuarios', usuario.id);
    if (perfil) {
      this.usuarioActual.set(perfil);
      return;
    }

    const metadatos = usuario.user_metadata;
    const { data, error } = await this.sup.Sup.from('usuarios')
      .upsert( // Upsert está mejor porque actualiza si ya existe, aparte acepta opciones
        {
          id: usuario.id,
          email: usuario.email,
          nombre: metadatos['nombre'],
          apellido: metadatos['apellido'],
          fecha_nacimiento: metadatos['fecha_nacimiento'],
          tipo_sangre: metadatos['tipo_sangre'],
          color_ojos: metadatos['color_ojos'],
          dias_vacaciones_por_anio: metadatos['dias_vacaciones_por_anio'],
        },
        { onConflict: 'id', ignoreDuplicates: true }, // onconflict: que busco que sea igual, ignoreduplicates: true, si es duplicada no hace nada
      )
      .select();

    if (error) {
      console.error('No se pudo crear el perfil del usuario', error);
      return;
    }
    // [] si fue el duplicado ignorado: la otra llamada es la que carga el perfil
    if (data[0]) this.usuarioActual.set(data[0]);
  }

  async registrar(datos: UsuarioRegistro) {
    // Los datos del perfil viajan como metadata. La fila de "usuarios" la crea cargarPerfil al iniciar sesión
    const { data, error } = await this.sup.Auth.signUp({
      email: datos.email,
      password: datos.contrasena,
      options: {
        data: {
          nombre: datos.nombre,
          apellido: datos.apellido,
          fecha_nacimiento: datos.fechaNacimiento,
          tipo_sangre: datos.tipoSangre,
          color_ojos: datos.colorOjos,
          dias_vacaciones_por_anio: datos.diasVacacionesPorAnio,
        },
      },
    });

    if (error) {
      console.error('No se pudo registrar', error);
      return error.code === 'user_already_exists'
        ? 'Ya existe una cuenta con ese correo.'
        : 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.';
    }
    if (!data.session) {
      return 'Te enviamos un correo para confirmar la cuenta. Confirmala y después iniciá sesión.';
    }
    return null;
  }

  // data trae la sesión iniciada. Pero, no hace falta usarla acá porque onAuthStateChange carga el perfil
  async iniciarSesion(usuario: UsuarioLogin) {
    const { data, error } = await this.sup.Auth.signInWithPassword({
      email: usuario.email,
      password: usuario.contrasena,
    });
    if (!error) return null;

    // Solo invalid_credentials es "contraseña mal", cualquier otro es un problema del servidor.
    if (error.code === 'invalid_credentials') return 'Correo o contraseña incorrectos.';
    console.error('No se pudo iniciar sesión', error);
    return 'No pudimos iniciar sesión. Intentá de nuevo en unos minutos.';
  }

  async cerrarSesion() {
    await this.sup.Auth.signOut();
  }

  // Usuario actual es mas lento, con esto tomo dsde el localStorage para que los guards funcionen sin problemas
  async haySesion() {
    const { data } = await this.sup.Auth.getSession();
    return data.session !== null;
  }

  // Exactamente la misma idea que la de arriba.
  async rolActual() {
    const { data } = await this.sup.Auth.getSession();
    if (!data.session) return null;
    const perfil = await this.db.findById('usuarios', data.session.user.id);
    return perfil?.rol ?? null;
  }
}
