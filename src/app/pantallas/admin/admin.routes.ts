import { Routes } from '@angular/router';

// Secciones del admin: se muestran adentro de admin.ts, en su <router-outlet />. Las carga app.routes.ts con loadChildren
export const adminRoutes: Routes = [
  { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
  {
    path: 'peliculas',
    loadComponent: () => import('./admin-peliculas/admin-peliculas').then((a) => a.AdminPeliculas),
  },
  {
    path: 'funciones',
    loadComponent: () => import('./admin-funciones/admin-funciones').then((a) => a.AdminFunciones),
  },
  {
    path: 'productos',
    loadComponent: () => import('./admin-candy/admin-candy').then((a) => a.AdminCandy),
  },
  {
    path: 'cupones',
    loadComponent: () => import('./admin-cupones/admin-cupones').then((a) => a.AdminCupones),
  },
  {
    path: 'empleados',
    loadComponent: () => import('./admin-empleados/admin-empleados').then((a) => a.AdminEmpleados),
  },
  {
    path: 'reportes',
    loadComponent: () => import('./admin-reportes/admin-reportes').then((a) => a.AdminReportes),
  },
  {
    path: 'actividad',
    loadComponent: () => import('./admin-log-actividad/admin-log-actividad').then((a) => a.AdminLogActividad),
  },
];
