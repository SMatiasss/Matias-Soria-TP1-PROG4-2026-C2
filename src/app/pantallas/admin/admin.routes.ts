import { Routes } from '@angular/router';

// Secciones del admin: se muestran adentro de admin.ts, en su <router-outlet />. Las carga app.routes.ts con loadChildren
export const adminRoutes: Routes = [
  { path: '', redirectTo: 'peliculas', pathMatch: 'full' },
  {
    path: 'peliculas',
    loadComponent: () => import('./admin-peliculas/admin-peliculas').then((a) => a.AdminPeliculas),
    title: 'Películas · Admin · allomund',
  },
  {
    path: 'funciones',
    loadComponent: () => import('./admin-funciones/admin-funciones').then((a) => a.AdminFunciones),
    title: 'Funciones · Admin · allomund',
  },
  {
    path: 'productos',
    loadComponent: () => import('./admin-candy/admin-candy').then((a) => a.AdminCandy),
    title: 'Productos · Admin · allomund',
  },
  {
    path: 'cupones',
    loadComponent: () => import('./admin-cupones/admin-cupones').then((a) => a.AdminCupones),
    title: 'Cupones · Admin · allomund',
  },
  {
    path: 'empleados',
    loadComponent: () => import('./admin-empleados/admin-empleados').then((a) => a.AdminEmpleados),
    title: 'Empleados · Admin · allomund',
  },
  {
    path: 'reportes',
    loadComponent: () => import('./admin-reportes/admin-reportes').then((a) => a.AdminReportes),
    title: 'Reportes · Admin · allomund',
  },
  {
    path: 'actividad',
    loadComponent: () => import('./admin-log-actividad/admin-log-actividad').then((a) => a.AdminLogActividad),
    title: 'Log de actividad · Admin · allomund',
  },
];
