// ─── Repository Partie ────────────────────────────────────────────────────
// Notion clé : include = JOIN, $transaction = atomicité
//
// Ce fichier démontre :
// 1. include (JOIN) pour charger les relations en une seule requête
// 2. $transaction pour garantir l'atomicité de la soumission d'essai
// 3. Les 3 comportements onDelete : Cascade (joueur), Restrict (mot), SetNull (défi)

import prismaClient from './prisma.client.js';
import type { Partie, Difficulte, ResultatPartie } from '../../shared/types.js';
import { motAleatoire } from './mot.repository.js';
// assurerDefiDuJour = get-or-create : garantit qu'un défi existe toujours,
// même si la date est hors de la plage seedée.
import { assurerDefiDuJour } from './defi.repository.js';
import { dateDuJourLocale } from '../date-locale.js';

// ─── Démarrer une nouvelle partie ────────────────────────────────────────
// Équivalent SQL : INSERT INTO parties (joueur_id, mot_id, difficulte) VALUES (?, ?, ?)
//
// Gestion des zombies EN_COURS :
// Avant de créer une nouvelle partie, on abandonne (PERDU) toutes les parties
// EN_COURS existantes du même joueur pour éviter l'accumulation de fantômes.
// Cette opération est atomique via $transaction.
export async function demarrerPartie(
  joueurId: number,
  difficulte: Difficulte,
  modeDefi = false
): Promise<Partie> {
  try {
    let motId: number;
    let defiQuotidienId: number | undefined;

    if (modeDefi) {
      // Mode défi : utilise assurerDefiDuJour (get-or-create) avec la date LOCALE
      // → ne peut plus échouer pour cause de défi manquant en base
      const dateAujourdhui = dateDuJourLocale();
      const defi = await assurerDefiDuJour(dateAujourdhui);
      motId = defi.motId;
      defiQuotidienId = defi.id;
    } else {
      // Mode entraînement : mot aléatoire selon la difficulté
      const mot = await motAleatoire(difficulte);
      if (!mot) throw new Error(`Aucun mot disponible pour la difficulté ${difficulte}.`);
      motId = mot.id;
    }

    // ─── $transaction : abandon des zombies + création atomiques ─────────
    // Équivalent SQL :
    // BEGIN;
    //   UPDATE parties SET resultat='PERDU', terminee_le=NOW()
    //     WHERE joueur_id=? AND resultat='EN_COURS';
    //   INSERT INTO parties (...) VALUES (...);
    // COMMIT;
    const partie = await prismaClient.$transaction(async (tx) => {
      // Abandonner proprement toutes les parties EN_COURS existantes
      await tx.partie.updateMany({
        where: { joueurId, resultat: 'EN_COURS' },
        data: { resultat: 'PERDU', termineeLe: new Date() },
      });

      return tx.partie.create({
        data: {
          joueurId,
          motId,
          defiQuotidienId: defiQuotidienId ?? null,
          difficulte,
          resultat: 'EN_COURS',
        },
        include: {
          // include = JOIN SQL : charge le mot et le joueur en une seule requête
          mot: true,
          joueur: true,
        },
      });
    });

    return partieVersInterface(partie);
  } catch (erreur) {
    console.error('[partie.repository] Erreur demarrerPartie :', erreur);
    throw erreur instanceof Error ? erreur : new Error('Impossible de démarrer la partie.');
  }
}

// ─── Récupérer une partie par son ID ─────────────────────────────────────
// Équivalent SQL :
// SELECT p.*, m.*, j.*, e.*
// FROM parties p
// JOIN mots m ON p.mot_id = m.id
// JOIN joueurs j ON p.joueur_id = j.id
// LEFT JOIN essais e ON p.id = e.partie_id
// WHERE p.id = ?
export async function partieParId(id: number): Promise<Partie | null> {
  try {
    const partie = await prismaClient.partie.findUnique({
      where: { id },
      include: {
        mot: true,
        joueur: true,
        essais: { orderBy: { indexLigne: 'asc' } },
      },
    });

    if (!partie) return null;
    return partieVersInterface(partie);
  } catch (erreur) {
    console.error('[partie.repository] Erreur partieParId :', erreur);
    throw new Error(`Partie ${id} introuvable.`);
  }
}

// ─── Historique des parties TERMINÉES d'un joueur ────────────────────────
// Notion vue en cours : clause WHERE avec filtre sur enum
// Les parties EN_COURS sont exclues : on ne révèle jamais le mot d'une partie
// encore active, et elles ne doivent pas polluer les statistiques d'historique.
//
// Équivalent SQL :
// SELECT p.*, m.* FROM parties p
// JOIN mots m ON p.mot_id = m.id
// WHERE p.joueur_id = ?
//   AND p.resultat IN ('GAGNE', 'PERDU')   -- exclut EN_COURS
// ORDER BY p.commencee_le DESC
export async function historique(joueurId: number): Promise<Partie[]> {
  try {
    const parties = await prismaClient.partie.findMany({
      where: {
        joueurId,
        // Filtre : uniquement les parties terminées (GAGNE ou PERDU)
        // Équivalent SQL : resultat IN ('GAGNE', 'PERDU')
        resultat: { in: ['GAGNE', 'PERDU'] },
      },
      include: {
        mot: true,
        essais: { orderBy: { indexLigne: 'asc' } },
      },
      orderBy: { commenceeLe: 'desc' },
    });

    return parties.map(partieVersInterface);
  } catch (erreur) {
    console.error('[partie.repository] Erreur historique :', erreur);
    throw new Error(`Impossible de récupérer l'historique du joueur ${joueurId}.`);
  }
}

// ─── Vérifier si un joueur a déjà joué le défi du jour ───────────────────
export async function partieDefiDuJourJoueur(
  joueurId: number,
  date: string
): Promise<Partie | null> {
  try {
    const defi = await prismaClient.defiQuotidien.findUnique({ where: { date } });
    if (!defi) return null;

    const partie = await prismaClient.partie.findFirst({
      where: { joueurId, defiQuotidienId: defi.id },
      include: { mot: true },
    });

    return partie ? partieVersInterface(partie) : null;
  } catch (erreur) {
    console.error('[partie.repository] Erreur partieDefiDuJourJoueur :', erreur);
    throw new Error('Impossible de vérifier le défi du jour.');
  }
}

// ─── Mettre à jour le résultat d'une partie ──────────────────────────────
// Équivalent SQL : UPDATE parties SET resultat = ?, nb_essais = ?, terminee_le = ? WHERE id = ?
export async function mettreAJourResultat(
  id: number,
  resultat: ResultatPartie,
  nbEssais: number
): Promise<Partie> {
  try {
    const partie = await prismaClient.partie.update({
      where: { id },
      data: {
        resultat,
        nbEssais,
        termineeLe: resultat !== 'EN_COURS' ? new Date() : null,
      },
      include: { mot: true, joueur: true },
    });
    return partieVersInterface(partie);
  } catch (erreur) {
    console.error('[partie.repository] Erreur mettreAJourResultat :', erreur);
    throw new Error(`Impossible de mettre à jour la partie ${id}.`);
  }
}

// ─── Fonction utilitaire : convertit un objet Prisma en interface Partie ─
function partieVersInterface(prismaPartie: {
  id: number;
  joueurId: number;
  motId: number;
  defiQuotidienId: number | null;
  difficulte: string;
  resultat: string;
  nbEssais: number;
  commenceeLe: Date;
  termineeLe: Date | null;
  mot?: { id: number; valeur: string; longueur: number; difficulte: string; definition: string | null } | null;
  joueur?: { id: number; pseudo: string; creeLe: Date } | null;
  essais?: Array<{ id: number; partieId: number; contenu: string; indexLigne: number; feedback: string; creeLe: Date }>;
}): Partie {
  return {
    id: prismaPartie.id,
    joueurId: prismaPartie.joueurId,
    motId: prismaPartie.motId,
    defiQuotidienId: prismaPartie.defiQuotidienId ?? undefined,
    difficulte: prismaPartie.difficulte as Difficulte,
    resultat: prismaPartie.resultat as ResultatPartie,
    nbEssais: prismaPartie.nbEssais,
    commenceeLe: prismaPartie.commenceeLe,
    termineeLe: prismaPartie.termineeLe ?? undefined,
    mot: prismaPartie.mot
      ? {
          id: prismaPartie.mot.id,
          valeur: prismaPartie.mot.valeur,
          longueur: prismaPartie.mot.longueur,
          difficulte: prismaPartie.mot.difficulte as Difficulte,
          definition: prismaPartie.mot.definition,
        }
      : undefined,
    joueur: prismaPartie.joueur
      ? {
          id: prismaPartie.joueur.id,
          pseudo: prismaPartie.joueur.pseudo,
          creeLe: prismaPartie.joueur.creeLe,
        }
      : undefined,
    essais: prismaPartie.essais?.map((e) => ({
      id: e.id,
      partieId: e.partieId,
      contenu: e.contenu,
      indexLigne: e.indexLigne,
      feedback: e.feedback,
      creeLe: e.creeLe,
    })),
  };
}
