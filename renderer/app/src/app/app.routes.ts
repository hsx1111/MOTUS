import { Routes } from '@angular/router';

export const routes: Routes = [
  // Redirection par défaut
  { path: '', redirectTo: 'jouer', pathMatch: 'full' },
  // Page de jeu principale
  {
    path: 'jouer',
    loadComponent: () => import('./pages/jeu/jeu').then((m) => m.Jeu),
  },
  // Historique des parties
  {
    path: 'historique',
    loadComponent: () => import('./pages/historique/historique').then((m) => m.Historique),
  },
  // Statistiques
  {
    path: 'statistiques',
    loadComponent: () => import('./pages/statistiques/statistiques').then((m) => m.Statistiques),
  },
  // Gestion des joueurs (CRUD)
  {
    path: 'joueurs',
    loadComponent: () => import('./pages/joueurs/joueurs').then((m) => m.Joueurs),
  },
  // Route wildcard
  { path: '**', redirectTo: 'jouer' },
];
