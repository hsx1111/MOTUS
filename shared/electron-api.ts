// ─── Contrat IPC complet ──────────────────────────────────────────────────
// Source de vérité unique des canaux IPC
// Importé par : src/preload.ts, src/main.ts, renderer/app (via types/electron.d.ts)
// Notion vue en cours : chaque méthode = un ipcRenderer.invoke() côté renderer
//                       = un ipcMain.handle() côté main

import type {
  Joueur,
  Mot,
  Theme,
  DefiQuotidien,
  Partie,
  Essai,
  Succes,
  JoueurSucces,
  StatistiquesJoueur,
  NombreMotsParTheme,
  CreerJoueurDto,
  ModifierJoueurDto,
  DemarrerPartieDto,
  SoumettreEssaiDto,
  Difficulte,
} from './types.js';

export interface ElectronAPI {
  // ─── Joueurs (CRUD complet) ──────────────────────────────────────────
  // canal : joueur:lister → SELECT * FROM joueurs
  joueurLister: () => Promise<Joueur[]>;
  // canal : joueur:creer → INSERT INTO joueurs
  joueurCreer: (dto: CreerJoueurDto) => Promise<Joueur>;
  // canal : joueur:par-id → SELECT * FROM joueurs WHERE id = ?
  joueurParId: (id: number) => Promise<Joueur | null>;
  // canal : joueur:modifier → UPDATE joueurs SET ...
  joueurModifier: (dto: ModifierJoueurDto) => Promise<Joueur>;
  // canal : joueur:supprimer → DELETE FROM joueurs WHERE id = ? (CASCADE sur parties)
  joueurSupprimer: (id: number) => Promise<void>;

  // ─── Mots ────────────────────────────────────────────────────────────
  motLister: (difficulte?: Difficulte) => Promise<Mot[]>;
  motAleatoire: (difficulte: Difficulte) => Promise<Mot | null>;

  // ─── Thèmes ──────────────────────────────────────────────────────────
  themeLister: () => Promise<Theme[]>;
  themeMotsCompte: () => Promise<NombreMotsParTheme[]>;

  // ─── Défi quotidien ──────────────────────────────────────────────────
  // canal : defi:du-jour → SELECT * FROM defis_quotidiens WHERE date = TODAY
  defiDuJour: () => Promise<DefiQuotidien | null>;

  // ─── Parties ─────────────────────────────────────────────────────────
  // canal : partie:demarrer → INSERT INTO parties + SELECT mot aléatoire
  partieDemarrer: (dto: DemarrerPartieDto) => Promise<Partie>;
  // canal : partie:par-id → SELECT * FROM parties WHERE id = ? (avec essais + mot)
  partieParId: (id: number) => Promise<Partie | null>;
  // canal : partie:historique → SELECT parties WHERE joueurId = ? ORDER BY commenceeLe DESC
  partieHistorique: (joueurId: number) => Promise<Partie[]>;
  // canal : partie:defi-du-jour-joueur → vérifie si le joueur a déjà joué le défi du jour
  partieDefiDuJourJoueur: (joueurId: number, date: string) => Promise<Partie | null>;

  // ─── Essais ──────────────────────────────────────────────────────────
  // canal : partie:soumettre-essai → $transaction (INSERT essai + UPDATE partie + débloquer succès)
  partieSoumettreEssai: (dto: SoumettreEssaiDto) => Promise<{
    essai: Essai;
    partie: Partie;
    succesDebloques: Succes[];
  }>;

  // ─── Statistiques (agrégations Prisma) ───────────────────────────────
  // canal : statistiques:joueur → count + groupBy + _avg
  statistiquesJoueur: (joueurId: number) => Promise<StatistiquesJoueur>;

  // ─── Succès ──────────────────────────────────────────────────────────
  succesJoueur: (joueurId: number) => Promise<JoueurSucces[]>;
}
