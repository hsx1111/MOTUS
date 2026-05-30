// ─── Preload Electron — Pont contextBridge ────────────────────────────────
// Notion clé pour l'oral :
// Le preload s'exécute dans un contexte isolé (contextIsolation: true).
// Il expose UNIQUEMENT les méthodes définies dans ElectronAPI via contextBridge.
// Le renderer (Angular) ne peut accéder à Node.js que via window.api.
//
// Pourquoi contextIsolation ? Sécurité : le renderer ne peut pas accéder à
// l'environnement Node.js directement — seules les méthodes explicitement
// exposées par contextBridge sont disponibles.

import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../shared/electron-api.js';

// Construction de l'objet API exposé au renderer
const api: ElectronAPI = {
  // ─── Joueurs ──────────────────────────────────────────────────────────
  joueurLister: () => ipcRenderer.invoke('joueur:lister'),
  joueurCreer: (dto) => ipcRenderer.invoke('joueur:creer', dto),
  joueurParId: (id) => ipcRenderer.invoke('joueur:par-id', id),
  joueurModifier: (dto) => ipcRenderer.invoke('joueur:modifier', dto),
  joueurSupprimer: (id) => ipcRenderer.invoke('joueur:supprimer', id),

  // ─── Mots ─────────────────────────────────────────────────────────────
  motLister: (difficulte) => ipcRenderer.invoke('mot:lister', difficulte),
  motAleatoire: (difficulte) => ipcRenderer.invoke('mot:aleatoire', difficulte),

  // ─── Thèmes ───────────────────────────────────────────────────────────
  themeLister: () => ipcRenderer.invoke('theme:lister'),
  themeMotsCompte: () => ipcRenderer.invoke('theme:mots-compte'),

  // ─── Défi quotidien ───────────────────────────────────────────────────
  defiDuJour: () => ipcRenderer.invoke('defi:du-jour'),

  // ─── Parties ──────────────────────────────────────────────────────────
  partieDemarrer: (dto) => ipcRenderer.invoke('partie:demarrer', dto),
  partieParId: (id) => ipcRenderer.invoke('partie:par-id', id),
  partieHistorique: (joueurId) => ipcRenderer.invoke('partie:historique', joueurId),
  partieDefiDuJourJoueur: (joueurId, date) =>
    ipcRenderer.invoke('partie:defi-du-jour-joueur', joueurId, date),

  // ─── Essais ───────────────────────────────────────────────────────────
  partieSoumettreEssai: (dto) => ipcRenderer.invoke('partie:soumettre-essai', dto),

  // ─── Statistiques ─────────────────────────────────────────────────────
  statistiquesJoueur: (joueurId) => ipcRenderer.invoke('statistiques:joueur', joueurId),

  // ─── Succès ───────────────────────────────────────────────────────────
  succesJoueur: (joueurId) => ipcRenderer.invoke('succes:joueur', joueurId),
};

// Exposer l'API au renderer via contextBridge
// window.api sera disponible dans Angular via types/electron.d.ts
contextBridge.exposeInMainWorld('api', api);
