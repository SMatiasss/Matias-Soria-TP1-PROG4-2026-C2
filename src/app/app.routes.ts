import { Routes } from '@angular/router';
import { invitadoGuard } from './logica/guards/invitado-guard';
import { authGuard } from './logica/guards/auth-guard';
import { empleadoGuard } from './logica/guards/empleado-guard';
import { adminGuard } from './logica/guards/admin-guard';

// title: lo que dice la pestaña del navegador en cada pantalla
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pantallas/inicio/inicio').then((a) => a.Inicio),
    title: 'allomund',
  },
  {
    path: 'cartelera',
    loadComponent: () => import('./pantallas/peliculas/listado/listado').then((a) => a.Listado),
    title: 'Cartelera · allomund',
  },
  {
    path: 'pelicula/:peliculaId',
    loadComponent: () => import('./pantallas/peliculas/detalle/detalle').then((a) => a.Detalle),
    title: 'Película · allomund',
  },
  {
    path: 'reservas/:funcionId',
    loadComponent: () => import('./pantallas/reservas/reservas').then((a) => a.Reservas),
    title: 'Comprar entradas · allomund',
  },
  {
    path: 'login',
    loadComponent: () => import('./pantallas/cuenta/login/login').then((a) => a.Login),
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión · allomund',
  },
  {
    path: 'registro',
    loadComponent: () => import('./pantallas/cuenta/registro/registro').then((a) => a.Registro),
    canActivate: [invitadoGuard],
    title: 'Crear cuenta · allomund',
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pantallas/cuenta/perfil/perfil').then((a) => a.Perfil),
    canActivate: [authGuard],
    title: 'Perfil · allomund',
  },
  {
    path: 'validar',
    loadComponent: () => import('./pantallas/empleado/validar/validar').then((a) => a.Validar),
    canActivate: [empleadoGuard],
    title: 'Validar QR · allomund',
  },
  {
    // el title de cada sección está en admin.routes.ts
    path: 'admin',
    loadComponent: () => import('./pantallas/admin/admin').then((a) => a.Admin),
    canActivate: [adminGuard],
    loadChildren: () => import('./pantallas/admin/admin.routes').then((a) => a.adminRoutes),
  },
  {
    // cualquier ruta que no existe. Va última porque las rutas se revisan en orden
    path: '**',
    loadComponent: () => import('./pantallas/error/error').then((a) => a.Error),
    title: 'Página no encontrada · allomund',
  },
];
