// ─── Main Process Electron ────────────────────────────────────────────────
// Rôle : créer la fenêtre BrowserWindow, gérer le cycle de vie Electron,
// et déclarer TOUS les handlers IPC (aucune requête Prisma directe ici)
//
// Notion clé pour l'oral :
// - Main process = contexte Node.js complet (accès fichiers, DB, OS)
// - Renderer process = contexte Chromium restreint (accès Web API uniquement)
// - IPC (Inter-Process Communication) = canal de communication entre les deux
// - ipcMain.handle + ipcRenderer.invoke = communication request/response

import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';

// ─── Configuration du chemin de la base de données ────────────────────────
// IMPORTANT : fixé programmatiquement AVANT d'importer @prisma/client
// Après compilation, main.js est dans dist/src/ → remonter de 2 niveaux
process.env['DATABASE_URL'] =
  'file:' + path.join(__dirname, '..', '..', 'prisma', 'motus.db');

// ─── Import des repositories (après la config DATABASE_URL) ──────────────
import * as joueurRepo from './repository/joueur.repository.js';
import * as motRepo from './repository/mot.repository.js';
import * as themeRepo from './repository/theme.repository.js';
import * as defiRepo from './repository/defi.repository.js';
import * as partieRepo from './repository/partie.repository.js';
import * as essaiRepo from './repository/essai.repository.js';
import * as statistiqueRepo from './repository/statistique.repository.js';
import { closeDb } from './repository/prisma.client.js';

// ─── Création de la fenêtre principale ───────────────────────────────────
function creerFenetre(): void {
  const fenetre = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'MOTUS',
    webPreferences: {
      // Chemin vers le script preload compilé
      preload: path.join(__dirname, 'preload.js'),
      // contextIsolation: true = sécurité — le renderer ne peut pas accéder à Node
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Chargement de l'application Angular compilée
  const indexHtml = path.join(
    __dirname,
    '..',
    '..',
    'renderer',
    'app',
    'dist',
    'app',
    'browser',
    'index.html'
  );
  fenetre.loadFile(indexHtml);
}

// ─── Cycle de vie Electron ────────────────────────────────────────────────
app.whenReady().then(() => {
  creerFenetre();

  // Sur macOS : recréer la fenêtre si elle est fermée mais l'app reste ouverte
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

// Quitter l'application quand toutes les fenêtres sont fermées (sauf macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Fermer proprement la connexion SQLite avant de quitter
app.on('before-quit', () => {
  closeDb().catch(console.error);
});

// ─── Handlers IPC ─────────────────────────────────────────────────────────
// Convention : chaque handle délègue AU repository, try/catch obligatoire
// Notion clé : ipcMain.handle = réception côté main, répond à ipcRenderer.invoke

// ─── Joueurs ──────────────────────────────────────────────────────────────
ipcMain.handle('joueur:lister', async () => {
  try {
    return await joueurRepo.listerJoueurs();
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('joueur:creer', async (_evt, dto: { pseudo: string }) => {
  try {
    return await joueurRepo.creerJoueur(dto.pseudo);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('joueur:par-id', async (_evt, id: number) => {
  try {
    return await joueurRepo.joueurParId(id);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('joueur:modifier', async (_evt, dto: { id: number; pseudo: string }) => {
  try {
    return await joueurRepo.modifierJoueur(dto.id, dto.pseudo);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('joueur:supprimer', async (_evt, id: number) => {
  try {
    return await joueurRepo.supprimerJoueur(id);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Mots ──────────────────────────────────────────────────────────────────
ipcMain.handle('mot:lister', async (_evt, difficulte?: string) => {
  try {
    return await motRepo.listerMots(difficulte as import('../shared/types.js').Difficulte | undefined);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('mot:aleatoire', async (_evt, difficulte: string) => {
  try {
    return await motRepo.motAleatoire(difficulte as import('../shared/types.js').Difficulte);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Thèmes ────────────────────────────────────────────────────────────────
ipcMain.handle('theme:lister', async () => {
  try {
    return await themeRepo.listerThemes();
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('theme:mots-compte', async () => {
  try {
    return await themeRepo.nombreMotsParTheme();
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Défi quotidien ────────────────────────────────────────────────────────
ipcMain.handle('defi:du-jour', async () => {
  try {
    const dateAujourdhui = new Date().toISOString().split('T')[0]!;
    return await defiRepo.defiDuJour(dateAujourdhui);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Parties ───────────────────────────────────────────────────────────────
ipcMain.handle('partie:demarrer', async (_evt, dto: { joueurId: number; difficulte: string; modeDefi?: boolean }) => {
  try {
    return await partieRepo.demarrerPartie(
      dto.joueurId,
      dto.difficulte as import('../shared/types.js').Difficulte,
      dto.modeDefi ?? false
    );
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('partie:par-id', async (_evt, id: number) => {
  try {
    return await partieRepo.partieParId(id);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('partie:historique', async (_evt, joueurId: number) => {
  try {
    return await partieRepo.historique(joueurId);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

ipcMain.handle('partie:defi-du-jour-joueur', async (_evt, joueurId: number, date: string) => {
  try {
    return await partieRepo.partieDefiDuJourJoueur(joueurId, date);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Essais ────────────────────────────────────────────────────────────────
ipcMain.handle('partie:soumettre-essai', async (_evt, dto: { partieId: number; contenu: string }) => {
  try {
    return await essaiRepo.soumettreEssai(dto.partieId, dto.contenu);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Statistiques ──────────────────────────────────────────────────────────
ipcMain.handle('statistiques:joueur', async (_evt, joueurId: number) => {
  try {
    return await statistiqueRepo.statistiquesJoueur(joueurId);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});

// ─── Succès ────────────────────────────────────────────────────────────────
ipcMain.handle('succes:joueur', async (_evt, joueurId: number) => {
  try {
    return await statistiqueRepo.succesJoueur(joueurId);
  } catch (erreur) {
    throw new Error(erreur instanceof Error ? erreur.message : 'Erreur serveur.');
  }
});
