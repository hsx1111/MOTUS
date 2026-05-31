// ─── Repository Défi Quotidien ────────────────────────────────────────────
// Gestion du mot du jour
//
// Deux fonctions exposées :
//   • defiDuJour(date)       — lecture pure (findUnique), renvoie null si absent
//   • assurerDefiDuJour(date) — get-or-create : garantit qu'un défi existe toujours,
//                               même si la date est hors de la plage seedée.

import prismaClient from './prisma.client.js';
import type { DefiQuotidien, Difficulte } from '../../shared/types.js';
import { indexMotPourDate } from '../date-locale.js';

// ─── Lecture pure : récupérer le défi pour une date donnée ───────────────
// Notion vue en cours : findUnique avec include = JOIN en SQL
// Équivalent SQL :
// SELECT d.*, m.*
// FROM defis_quotidiens d
// JOIN mots m ON d.mot_id = m.id
// WHERE d.date = ?
export async function defiDuJour(date: string): Promise<DefiQuotidien | null> {
  try {
    const defi = await prismaClient.defiQuotidien.findUnique({
      where: { date },
      include: { mot: true },
    });

    if (!defi) return null;
    return defiVersInterface(defi);
  } catch (erreur) {
    console.error('[defi.repository] Erreur defiDuJour :', erreur);
    throw new Error(`Impossible de récupérer le défi du ${date}.`);
  }
}

// ─── Get-or-create : assurer qu'un défi existe pour une date ─────────────
// Si le défi n'existe pas (date hors plage seedée, base réinitialisée, etc.),
// on en crée un automatiquement avec un mot choisi de façon DÉTERMINISTE.
//
// Notion vue en cours : upsert = INSERT … ON CONFLICT DO UPDATE en SQL
// Équivalent SQL :
// INSERT INTO defis_quotidiens (date, mot_id)
//   SELECT ?, id FROM mots ORDER BY id LIMIT 1 OFFSET ?
//   ON CONFLICT (date) DO NOTHING
// RETURNING *
//
// Le mot est choisi par : index = hash(date) % nb_mots (stable, reproductible)
// → même date → même mot, peu importe quand assurerDefiDuJour est appelé.
export async function assurerDefiDuJour(date: string): Promise<DefiQuotidien> {
  try {
    // 1. Chercher un défi existant (chemin rapide, sans écriture)
    const defiExistant = await prismaClient.defiQuotidien.findUnique({
      where: { date },
      include: { mot: true },
    });

    if (defiExistant) {
      return defiVersInterface(defiExistant);
    }

    // 2. Aucun défi pour cette date → en créer un de façon déterministe
    // Récupérer tous les mots triés par id (ordre stable)
    // Équivalent SQL : SELECT id FROM mots ORDER BY id
    const tousMots = await prismaClient.mot.findMany({
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (tousMots.length === 0) {
      throw new Error(
        'Impossible de créer le défi du jour : aucun mot en base. Lancez npm run db:seed.'
      );
    }

    // Choix déterministe : même hash → même index → même mot pour cette date
    const index = indexMotPourDate(date, tousMots.length);
    const motChoisi = tousMots[index]!;

    // upsert pour éviter toute course (deux requêtes simultanées sur la même date)
    // Notion vue en cours : upsert = atomique, pas de doublon possible
    // Équivalent SQL : INSERT … ON CONFLICT (date) DO NOTHING
    const defiCree = await prismaClient.defiQuotidien.upsert({
      where: { date },
      create: { date, motId: motChoisi.id },
      update: {}, // si une course a déjà inséré, on garde l'existant sans modifier
      include: { mot: true },
    });

    console.log(
      `[defi.repository] Défi du ${date} créé automatiquement (mot id=${motChoisi.id}).`
    );
    return defiVersInterface(defiCree);
  } catch (erreur) {
    console.error('[defi.repository] Erreur assurerDefiDuJour :', erreur);
    throw erreur instanceof Error
      ? erreur
      : new Error(`Impossible d'assurer le défi du ${date}.`);
  }
}

// ─── Convertisseur interne ────────────────────────────────────────────────
function defiVersInterface(prismaDefi: {
  id: number;
  date: string;
  motId: number;
  mot?: {
    id: number;
    valeur: string;
    longueur: number;
    difficulte: string;
    definition: string | null;
  } | null;
}): DefiQuotidien {
  return {
    id: prismaDefi.id,
    date: prismaDefi.date,
    motId: prismaDefi.motId,
    mot: prismaDefi.mot
      ? {
          id: prismaDefi.mot.id,
          valeur: prismaDefi.mot.valeur,
          longueur: prismaDefi.mot.longueur,
          difficulte: prismaDefi.mot.difficulte as Difficulte,
          definition: prismaDefi.mot.definition,
        }
      : undefined,
  };
}
