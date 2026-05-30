// ─── Repository Joueur — CRUD complet ─────────────────────────────────────
// Pattern Repository : toutes les requêtes Prisma centralisées ici
// main.ts ne contient AUCUNE requête Prisma directe

import prismaClient from './prisma.client.js';
import type { Joueur } from '../../shared/types.js';

// ─── Lister tous les joueurs ──────────────────────────────────────────────
// Équivalent SQL : SELECT * FROM joueurs ORDER BY cree_le DESC
export async function listerJoueurs(): Promise<Joueur[]> {
  try {
    return await prismaClient.joueur.findMany({
      orderBy: { creeLe: 'desc' },
    });
  } catch (erreur) {
    console.error('[joueur.repository] Erreur listerJoueurs :', erreur);
    throw new Error('Impossible de récupérer la liste des joueurs.');
  }
}

// ─── Récupérer un joueur par son ID ──────────────────────────────────────
// Équivalent SQL : SELECT * FROM joueurs WHERE id = ?
export async function joueurParId(id: number): Promise<Joueur | null> {
  try {
    return await prismaClient.joueur.findUnique({ where: { id } });
  } catch (erreur) {
    console.error('[joueur.repository] Erreur joueurParId :', erreur);
    throw new Error(`Joueur ${id} introuvable.`);
  }
}

// ─── Créer un joueur ──────────────────────────────────────────────────────
// Équivalent SQL : INSERT INTO joueurs (pseudo) VALUES (?)
export async function creerJoueur(pseudo: string): Promise<Joueur> {
  try {
    return await prismaClient.joueur.create({
      data: { pseudo },
    });
  } catch (erreur) {
    console.error('[joueur.repository] Erreur creerJoueur :', erreur);
    // Cas fréquent : pseudo déjà pris (contrainte UNIQUE)
    throw new Error(`Impossible de créer le joueur "${pseudo}". Le pseudo est peut-être déjà utilisé.`);
  }
}

// ─── Modifier un joueur ───────────────────────────────────────────────────
// Équivalent SQL : UPDATE joueurs SET pseudo = ? WHERE id = ?
export async function modifierJoueur(id: number, pseudo: string): Promise<Joueur> {
  try {
    return await prismaClient.joueur.update({
      where: { id },
      data: { pseudo },
    });
  } catch (erreur) {
    console.error('[joueur.repository] Erreur modifierJoueur :', erreur);
    throw new Error(`Impossible de modifier le joueur ${id}.`);
  }
}

// ─── Supprimer un joueur ──────────────────────────────────────────────────
// Équivalent SQL : DELETE FROM joueurs WHERE id = ?
// Grâce à onDelete: Cascade, toutes les parties du joueur sont également supprimées
export async function supprimerJoueur(id: number): Promise<void> {
  try {
    await prismaClient.joueur.delete({ where: { id } });
  } catch (erreur) {
    console.error('[joueur.repository] Erreur supprimerJoueur :', erreur);
    throw new Error(`Impossible de supprimer le joueur ${id}.`);
  }
}
