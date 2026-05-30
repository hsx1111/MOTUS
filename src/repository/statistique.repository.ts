// ─── Repository Statistiques — Agrégations Prisma ────────────────────────
// Ce fichier est CENTRAL pour l'oral — il démontre TOUTES les agrégations :
// count, groupBy, _avg, _count sur relation
//
// Notion clé : Prisma traduit ces appels en SQL agrégé optimisé

import prismaClient from './prisma.client.js';
import type { StatistiquesJoueur, RepartitionEssai, JoueurSucces } from '../../shared/types.js';

// ─── Statistiques complètes d'un joueur ──────────────────────────────────
export async function statistiquesJoueur(joueurId: number): Promise<StatistiquesJoueur> {
  try {
    // ─── count : nombre de parties terminées par résultat ────────────
    // On ne compte QUE les parties terminées (GAGNE ou PERDU).
    // Les EN_COURS sont exclues : une partie non terminée ne contribue
    // pas aux statistiques (taux de réussite, moyenne, séries).
    // Équivalent SQL :
    // SELECT COUNT(*) FROM parties WHERE joueur_id = ? AND resultat = 'GAGNE'
    const partiesGagnees = await prismaClient.partie.count({
      where: { joueurId, resultat: 'GAGNE' },
    });
    const partiesPerdues = await prismaClient.partie.count({
      where: { joueurId, resultat: 'PERDU' },
    });
    // totalParties = parties terminées uniquement (cohérent avec le filtre historique)
    const totalParties = partiesGagnees + partiesPerdues;
    // partiesEnCours conservé pour information (affiché séparément dans l'UI)
    const partiesEnCours = 0;

    // ─── _avg : moyenne des essais sur les parties gagnées ────────────
    // Équivalent SQL :
    // SELECT AVG(nb_essais) FROM parties WHERE joueur_id = ? AND resultat = 'GAGNE'
    const aggregatEssais = await prismaClient.partie.aggregate({
      where: { joueurId, resultat: 'GAGNE' },
      _avg: { nbEssais: true },
    });
    const moyenneEssais = aggregatEssais._avg.nbEssais ?? 0;

    // ─── groupBy : répartition du nombre d'essais ─────────────────────
    // Équivalent SQL :
    // SELECT nb_essais, COUNT(*) as nombre
    // FROM parties WHERE joueur_id = ? AND resultat = 'GAGNE'
    // GROUP BY nb_essais ORDER BY nb_essais
    const repartitionBrute = await prismaClient.partie.groupBy({
      by: ['nbEssais'],
      where: { joueurId, resultat: 'GAGNE' },
      _count: { id: true },
      orderBy: { nbEssais: 'asc' },
    });

    const repartitionEssais: RepartitionEssai[] = repartitionBrute.map((r) => ({
      nbEssais: r.nbEssais,
      nombreParties: r._count.id,
    }));

    // ─── Calcul des séries (streak) ────────────────────────────────────
    const toutesParties = await prismaClient.partie.findMany({
      where: { joueurId, resultat: { in: ['GAGNE', 'PERDU'] } },
      orderBy: { termineeLe: 'asc' },
      select: { resultat: true },
    });

    let serieActuelle = 0;
    let meilleureSeriere = 0;
    let serieCourante = 0;

    for (const partie of toutesParties) {
      if (partie.resultat === 'GAGNE') {
        serieCourante++;
        if (serieCourante > meilleureSeriere) meilleureSeriere = serieCourante;
      } else {
        serieCourante = 0;
      }
    }
    serieActuelle = serieCourante;

    // ─── Succès débloqués ─────────────────────────────────────────────
    // Équivalent SQL :
    // SELECT js.*, s.* FROM joueur_succes js
    // JOIN succes s ON js.succes_id = s.id
    // WHERE js.joueur_id = ?
    const succesJoueur = await prismaClient.joueurSucces.findMany({
      where: { joueurId },
      include: { succes: true },
    });

    const succes: JoueurSucces[] = succesJoueur.map((js) => ({
      joueurId: js.joueurId,
      succesId: js.succesId,
      debloqueLe: js.debloqueLe,
      succes: js.succes
        ? {
            id: js.succes.id,
            code: js.succes.code,
            libelle: js.succes.libelle,
            description: js.succes.description,
          }
        : undefined,
    }));

    return {
      joueurId,
      totalParties,
      partiesGagnees,
      partiesPerdues,
      partiesEnCours,
      tauxReussite: totalParties > 0 ? Math.round((partiesGagnees / (partiesGagnees + partiesPerdues || 1)) * 100) : 0,
      moyenneEssais: Math.round(moyenneEssais * 10) / 10,
      serieActuelle,
      meilleureSeriere,
      repartitionEssais,
      succes,
    };
  } catch (erreur) {
    console.error('[statistique.repository] Erreur statistiquesJoueur :', erreur);
    throw new Error(`Impossible de récupérer les statistiques du joueur ${joueurId}.`);
  }
}

// ─── Succès d'un joueur ───────────────────────────────────────────────────
export async function succesJoueur(joueurId: number): Promise<JoueurSucces[]> {
  try {
    const resultats = await prismaClient.joueurSucces.findMany({
      where: { joueurId },
      include: { succes: true },
      orderBy: { debloqueLe: 'desc' },
    });

    return resultats.map((js) => ({
      joueurId: js.joueurId,
      succesId: js.succesId,
      debloqueLe: js.debloqueLe,
      succes: js.succes
        ? {
            id: js.succes.id,
            code: js.succes.code,
            libelle: js.succes.libelle,
            description: js.succes.description,
          }
        : undefined,
    }));
  } catch (erreur) {
    console.error('[statistique.repository] Erreur succesJoueur :', erreur);
    throw new Error(`Impossible de récupérer les succès du joueur ${joueurId}.`);
  }
}
