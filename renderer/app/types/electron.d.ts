// ─── Déclaration des types Electron pour Angular ─────────────────────────
// Re-exporte les types partagés et déclare window.api

export type {
  Joueur,
  Mot,
  Theme,
  MotTheme,
  DefiQuotidien,
  Partie,
  Essai,
  Succes,
  JoueurSucces,
  Difficulte,
  ResultatPartie,
  EtatLettre,
  LettreGrille,
  LigneGrille,
  StatistiquesJoueur,
  RepartitionEssai,
  NombreMotsParTheme,
  CreerJoueurDto,
  ModifierJoueurDto,
  DemarrerPartieDto,
  SoumettreEssaiDto,
} from '../../../shared/types';

export type { ElectronAPI } from '../../../shared/electron-api';

import type { ElectronAPI } from '../../../shared/electron-api';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
