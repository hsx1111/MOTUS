// ─── Repository Mot ───────────────────────────────────────────────────────
// Équivalent SQL : requêtes sur la table mots

import prismaClient from './prisma.client.js';
import type { Mot, Difficulte } from '../../shared/types.js';

// ─── Lister les mots (avec filtre optionnel par difficulté) ───────────────
// Équivalent SQL : SELECT * FROM mots [WHERE difficulte = ?]
export async function listerMots(difficulte?: Difficulte): Promise<Mot[]> {
  try {
    return await prismaClient.mot.findMany({
      where: difficulte ? { difficulte } : undefined,
      orderBy: { valeur: 'asc' },
    });
  } catch (erreur) {
    console.error('[mot.repository] Erreur listerMots :', erreur);
    throw new Error('Impossible de récupérer les mots.');
  }
}

// ─── Mot aléatoire selon la difficulté ───────────────────────────────────
// Équivalent SQL : SELECT * FROM mots WHERE difficulte = ? ORDER BY RANDOM() LIMIT 1
export async function motAleatoire(difficulte: Difficulte): Promise<Mot | null> {
  try {
    const nombreMots = await prismaClient.mot.count({ where: { difficulte } });
    if (nombreMots === 0) return null;
    const saut = Math.floor(Math.random() * nombreMots);
    const mots = await prismaClient.mot.findMany({
      where: { difficulte },
      skip: saut,
      take: 1,
    });
    return mots[0] ?? null;
  } catch (erreur) {
    console.error('[mot.repository] Erreur motAleatoire :', erreur);
    throw new Error('Impossible de sélectionner un mot aléatoire.');
  }
}

// ─── Vérifier qu'un mot existe dans le dictionnaire ──────────────────────
// Équivalent SQL : SELECT id FROM mots WHERE UPPER(valeur) = UPPER(?)
export async function motExiste(valeur: string): Promise<boolean> {
  try {
    const mot = await prismaClient.mot.findUnique({
      where: { valeur: valeur.toUpperCase() },
    });
    return mot !== null;
  } catch (erreur) {
    console.error('[mot.repository] Erreur motExiste :', erreur);
    return false;
  }
}
