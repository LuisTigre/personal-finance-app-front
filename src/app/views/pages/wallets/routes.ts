import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./wallets.component').then(m => m.WalletsComponent),
    data: {
      title: 'Wallets'
    }
  }
];
