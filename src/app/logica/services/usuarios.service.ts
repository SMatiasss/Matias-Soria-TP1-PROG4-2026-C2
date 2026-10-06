import { inject, Service } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { environment } from '../../../environments/environment';
import { EmpleadoNuevo } from '../modelos/usuarios';

@Service()
export class UsuariosService {
  private sup = inject(SupabaseService);

  // Profe, puedo usar un segundo cliente de Supabase? signUp deja logueado con la cuenta nueva, y con el de
  // siempre el admin pasaría a ser el empleado. Este no guarda la sesión, así la del admin no se toca
  private altaDeCuentas = createClient(environment.SUPABASE_URL, environment.SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, storageKey: 'alta-de-empleados' },
  });

  // Los empleados para la lista del admin. Lo hace la función cargar_empleados, porque solo puedo ver mi perfil
  async cargarEmpleados() {
    const { data, error } = await this.sup.Sup.rpc('cargar_empleados');

    if (error) {
      console.error('No se pudieron cargar los empleados', error);
      return [];
    }
    return data;
  }

  // Cambia nombre y apellido de un empleado (función editar_empleado). Devuelve el error o null
  async editarEmpleado(id: string, nombre: string, apellido: string) {
    const { error } = await this.sup.Sup.rpc('editar_empleado', { p_id: id, p_nombre: nombre, p_apellido: apellido });
    if (error) console.error('No se pudo editar el empleado', error);
    return error;
  }

  // Crea la cuenta de un empleado: primero en Supabase Auth y después su perfil. Devuelve por qué no se pudo, o null
  async crearEmpleado(empleado: EmpleadoNuevo) {
    // la base guarda el correo en minúscula, como lo deja Supabase Auth
    const email = empleado.email.trim().toLowerCase();
    const { error } = await this.altaDeCuentas.auth.signUp({ email, password: empleado.contrasena });
    if (error) {
      console.error('No se pudo crear la cuenta del empleado', error);
      return error.code === 'user_already_exists'
        ? 'Ya existe una cuenta con ese correo.'
        : 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.';
    }
    // la sesión del empleado nuevo no se usa para nada: se cierra enseguida
    await this.altaDeCuentas.auth.signOut();

    // el perfil con rol empleado lo crea la función crear_perfil_empleado, que solo puede usar el admin
    const perfil = await this.sup.Sup.rpc('crear_perfil_empleado', {
      p_email: email,
      p_nombre: empleado.nombre,
      p_apellido: empleado.apellido,
    });
    if (perfil.error) {
      console.error('No se pudo crear el perfil del empleado', perfil.error);
      // P0001: el mensaje que escribe la función, ej: "Ya hay una cuenta con ese correo"
      return perfil.error.code === 'P0001'
        ? perfil.error.message
        : 'Se creó la cuenta, pero no su perfil de empleado. Intentá de nuevo más tarde.';
    }
    return null;
  }
}
