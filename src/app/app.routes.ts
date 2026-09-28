import { Routes } from '@angular/router';
import { invitadoGuard } from './logica/guards/invitado-guard';
import { authGuard } from './logica/guards/auth-guard';
import { empleadoGuard } from './logica/guards/empleado-guard';
import { adminGuard } from './logica/guards/admin-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pantallas/inicio/inicio').then((a) => a.Inicio),
  },
  {
    path: 'cartelera',
    loadComponent: () => import('./pantallas/peliculas/listado/listado').then((a) => a.Listado),
  },
  {
    path: 'pelicula/:peliculaId',
    loadComponent: () => import('./pantallas/peliculas/detalle/detalle').then((a) => a.Detalle),
  },
  {
    path: 'reservas/:funcionId',
    loadComponent: () => import('./pantallas/reservas/reservas').then((a) => a.Reservas),
  },
  {
    path: 'login',
    loadComponent: () => import('./pantallas/cuenta/login/login').then((a) => a.Login),
    canActivate: [invitadoGuard],
  },
  {
    path: 'registro',
    loadComponent: () => import('./pantallas/cuenta/registro/registro').then((a) => a.Registro),
    canActivate: [invitadoGuard],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pantallas/cuenta/perfil/perfil').then((a) => a.Perfil),
    canActivate: [authGuard],
  },
  {
    path: 'validar',
    loadComponent: () => import('./pantallas/empleado/validar/validar').then((a) => a.Validar),
    canActivate: [empleadoGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./pantallas/admin/admin').then((a) => a.Admin),
    canActivate: [adminGuard],
    loadChildren: () => import('./pantallas/admin/admin.routes').then((a) => a.adminRoutes),
  },
  { path: '**', redirectTo: '' },
];
