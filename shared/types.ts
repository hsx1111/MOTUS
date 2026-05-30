// ─── Types partagés MOTUS ──────────────────────────────────────────────────
// Source de vérité unique : importé par main.ts, preload.ts ET Angular
// Notion vue en cours : les interfaces TypeScript correspondent aux modèles Prisma
// qui eux-mêmes correspondent aux tables SQL

// ─── Enums (miroir des enums Prisma) ──────────────────────────────────────

export type Difficulte = 'FACILE' | 'MOYEN' | 'DIFFICILE';
export type ResultatPartie = 'EN_COURS' | 'GAGNE' | 'PERDU';

// ─── État d'une lettre dans le feedback MOTUS ──────────────────────────────
// CORRECT = bonne lettre, bonne place (rouge dans MOTUS)
// PRESENT = bonne lettre, mauvaise place (jaune)
// ABSENT  = lettre absente du mot
export type EtatLettre = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'VIDE' | 'EN_COURS';

// ─── Interfaces métier (correspondent aux tables SQL) ─────────────────────

// Équivalent SQL : SELECT * FROM joueurs
export interface Joueur {
  id: number;
  pseudo: string;
  creeLe: Date;
}

// Équivalent SQL : SELECT * FROM mots
export interface Mot {
  id: number;
  valeur: string;
  longueur: number;
  difficulte: Difficulte;
  definition?: string | null;
}

// Équivalent SQL : SELECT * FROM themes
export interface Theme {
  id: number;
  nom: string;
  couleur: string;
}

// Équivalent SQL : SELECT * FROM mot_theme (table de jonction N:M)
export interface MotTheme {
  motId: number;
  themeId: number;
  theme?: Theme;
  mot?: Mot;
}

// Équivalent SQL : SELECT * FROM defis_quotidiens
export interface DefiQuotidien {
  id: number;
  date: string;
  motId: number;
  mot?: Mot;
}

// Équivalent SQL : SELECT * FROM parties
export interface Partie {
  id: number;
  joueurId: number;
  motId: number;
  defiQuotidienId?: number | null;
  difficulte: Difficulte;
  resultat: ResultatPartie;
  nbEssais: number;
  commenceeLe: Date;
  termineeLe?: Date | null;
  joueur?: Joueur;
  mot?: Mot;
  essais?: Essai[];
}

// Équivalent SQL : SELECT * FROM essais
export interface Essai {
  id: number;
  partieId: number;
  contenu: string;
  indexLigne: number;
  feedback: string;
  creeLe: Date;
}

// Équivalent SQL : SELECT * FROM succes
export interface Succes {
  id: number;
  code: string;
  libelle: string;
  description?: string | null;
}

// Équivalent SQL : SELECT * FROM joueur_succes (table de jonction N:M)
export interface JoueurSucces {
  joueurId: number;
  succesId: number;
  debloqueLe: Date;
  succes?: Succes;
}

// ─── DTOs de création (Data Transfer Objects) ─────────────────────────────
// Utilisés pour les requêtes IPC — ne contiennent que les champs nécessaires

export interface CreerJoueurDto {
  pseudo: string;
}

export interface ModifierJoueurDto {
  id: number;
  pseudo: string;
}

export interface DemarrerPartieDto {
  joueurId: number;
  difficulte: Difficulte;
  modeDefi?: boolean;
}

export interface SoumettreEssaiDto {
  partieId: number;
  contenu: string;
}

// ─── Vue-modèles pour l'interface ────────────────────────────────────────

// Une lettre dans la grille avec son état coloré
export interface LettreGrille {
  lettre: string;
  etat: EtatLettre;
}

// Une ligne complète d'essai dans la grille
export interface LigneGrille {
  lettres: LettreGrille[];
  estSoumise: boolean;
  estCourante: boolean;
}

// ─── Statistiques agrégées ────────────────────────────────────────────────

export interface StatistiquesJoueur {
  joueurId: number;
  totalParties: number;
  partiesGagnees: number;
  partiesPerdues: number;
  partiesEnCours: number;
  tauxReussite: number;
  moyenneEssais: number;
  serieActuelle: number;
  meilleureSeriere: number;
  repartitionEssais: RepartitionEssai[];
  succes: JoueurSucces[];
}

export interface RepartitionEssai {
  nbEssais: number;
  nombreParties: number;
}

export interface NombreMotsParTheme {
  theme: Theme;
  nombreMots: number;
}
