import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./transactions-page.component').then((m) => m.TransactionsPageComponent),
    data: {
      title: 'Transactions'
    }
  }
];
