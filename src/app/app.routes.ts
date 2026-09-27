import { Routes } from '@angular/router';
import { invitadoGuard } from './logica/guards/invitado-guard';
import { authGuard } from './logica/guards/auth-guard';
import { empleadoGuard } from './logica/guards/empleado-guard';
import { adminGuard } from './logica/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pantallas/inicio/inicio').then((m) => m.Inicio),
  },
  {
    path: 'cartelera',
    loadComponent: () => import('./pantallas/peliculas/listado/listado').then((m) => m.Listado),
  },
  {
    path: 'pelicula/:peliculaId',
    loadComponent: () => import('./pantallas/peliculas/detalle/detalle').then((m) => m.Detalle),
  },
  {
    path: 'reservas/:funcionId',
    loadComponent: () => import('./pantallas/reservas/reservas').then((m) => m.Reservas),
  },
  {
    path: 'login',
    loadComponent: () => import('./pantallas/cuenta/login/login').then((m) => m.Login),
    canActivate: [invitadoGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('./pantallas/cuenta/registro/registro').then((m) => m.Registro),
    canActivate: [invitadoGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pantallas/cuenta/perfil/perfil').then((m) => m.Perfil),
    canActivate: [authGuard],
  },
  {
    path: 'validar',
    loadComponent: () => import('./pantallas/empleado/validar/validar').then((m) => m.Validar),
    canActivate: [empleadoGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./pantallas/admin/admin/admin').then((m) => m.Admin),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
      {
        path: 'peliculas',
        loadComponent: () => import('./pantallas/admin/admin-peliculas/admin-peliculas').then((m) => m.AdminPeliculas),
      },
      {
        path: 'funciones',
        loadComponent: () => import('./pantallas/admin/admin-funciones/admin-funciones').then((m) => m.AdminFunciones),
      },
      {
        path: 'candy',
        loadComponent: () => import('./pantallas/admin/admin-candy/admin-candy').then((m) => m.AdminCandy),
      },
      {
        path: 'cupones',
        loadComponent: () => import('./pantallas/admin/admin-cupones/admin-cupones').then((m) => m.AdminCupones),
      },
      {
        path: 'reportes',
        loadComponent: () => import('./pantallas/admin/admin-reportes/admin-reportes').then((m) => m.AdminReportes),
      },
      {
        path: 'actividad',
        loadComponent: () =>
          import('./pantallas/admin/admin-log-actividad/admin-log-actividad').then((m) => m.AdminLogActividad),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
