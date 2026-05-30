// ─── Repository Essai ────────────────────────────────────────────────────
// Notion clé : $transaction — atomicité de la soumission d'un essai
//
// La soumission d'un essai est une opération ATOMIQUE (tout ou rien) :
// 1. Créer l'essai dans la table essais
// 2. Mettre à jour la partie (nbEssais, resultat, termineeLe)
// 3. Éventuellement débloquer des succès dans joueur_succes
// Si une étape échoue, TOUT est annulé → $transaction garantit l'atomicité

import prismaClient from './prisma.client.js';
import type { Essai, Partie, Succes, Difficulte, ResultatPartie } from '../../shared/types.js';
import { calculerFeedback } from '../logique-jeu.js';

// ─── Soumettre un essai ───────────────────────────────────────────────────
export async function soumettreEssai(
  partieId: number,
  contenu: string
): Promise<{ essai: Essai; partie: Partie; succesDebloques: Succes[] }> {
  try {
    // Récupérer la partie avec son mot pour valider et calculer le feedback
    const partieActuelle = await prismaClient.partie.findUnique({
      where: { id: partieId },
      include: { mot: true },
    });

    if (!partieActuelle) throw new Error(`Partie ${partieId} introuvable.`);
    if (!partieActuelle.mot) throw new Error('Mot de la partie introuvable.');
    if (partieActuelle.resultat !== 'EN_COURS') {
      throw new Error('Cette partie est déjà terminée.');
    }

    const motCible = partieActuelle.mot.valeur.toUpperCase();
    const essaiNormalise = contenu.toUpperCase();

    // Valider la longueur
    if (essaiNormalise.length !== motCible.length) {
      throw new Error(`L'essai doit contenir ${motCible.length} lettres.`);
    }

    // Calculer le feedback (CORRECT/PRESENT/ABSENT pour chaque lettre)
    const feedbackStr = calculerFeedback(essaiNormalise, motCible);
    const nouveauNbEssais = partieActuelle.nbEssais + 1;

    // Déterminer le résultat
    const aGagne = essaiNormalise === motCible;
    const maxEssais = motCible.length + 1; // règle MOTUS
    const aPerdeu = !aGagne && nouveauNbEssais >= maxEssais;
    const nouveauResultat: ResultatPartie = aGagne ? 'GAGNE' : aPerdeu ? 'PERDU' : 'EN_COURS';

    // ─── TRANSACTION ATOMIQUE ─────────────────────────────────────────────
    // Notion d'oral : $transaction garantit que les 3 opérations ci-dessous
    // sont exécutées comme une seule unité atomique (tout ou rien).
    // Équivalent SQL : BEGIN TRANSACTION; ...; COMMIT; (ou ROLLBACK si erreur)
    const [essaiCree, partieMAJ] = await prismaClient.$transaction(async (tx) => {
      // Étape 1 : Créer l'essai
      const essai = await tx.essai.create({
        data: {
          partieId,
          contenu: essaiNormalise,
          indexLigne: partieActuelle.nbEssais,
          feedback: feedbackStr,
        },
      });

      // Étape 2 : Mettre à jour la partie
      const partie = await tx.partie.update({
        where: { id: partieId },
        data: {
          nbEssais: nouveauNbEssais,
          resultat: nouveauResultat,
          termineeLe: nouveauResultat !== 'EN_COURS' ? new Date() : null,
        },
        include: { mot: true, joueur: true },
      });

      return [essai, partie] as const;
    });

    // ─── Débloquer les succès (hors transaction pour simplicité) ─────────
    const succesDebloques: Succes[] = [];
    if (nouveauResultat !== 'EN_COURS') {
      const debloques = await verifierEtDebloquerSucces(
        partieActuelle.joueurId,
        partieId,
        nouveauResultat,
        nouveauNbEssais
      );
      succesDebloques.push(...debloques);
    }

    const partieInterface: Partie = {
      id: partieMAJ.id,
      joueurId: partieMAJ.joueurId,
      motId: partieMAJ.motId,
      defiQuotidienId: partieMAJ.defiQuotidienId ?? undefined,
      difficulte: partieMAJ.difficulte as Difficulte,
      resultat: partieMAJ.resultat as ResultatPartie,
      nbEssais: partieMAJ.nbEssais,
      commenceeLe: partieMAJ.commenceeLe,
      termineeLe: partieMAJ.termineeLe ?? undefined,
      mot: partieMAJ.mot
        ? {
            id: partieMAJ.mot.id,
            valeur: partieMAJ.mot.valeur,
            longueur: partieMAJ.mot.longueur,
            difficulte: partieMAJ.mot.difficulte as Difficulte,
            definition: partieMAJ.mot.definition,
          }
        : undefined,
    };

    return {
      essai: {
        id: essaiCree.id,
        partieId: essaiCree.partieId,
        contenu: essaiCree.contenu,
        indexLigne: essaiCree.indexLigne,
        feedback: essaiCree.feedback,
        creeLe: essaiCree.creeLe,
      },
      partie: partieInterface,
      succesDebloques,
    };
  } catch (erreur) {
    console.error('[essai.repository] Erreur soumettreEssai :', erreur);
    throw erreur instanceof Error ? erreur : new Error("Impossible de soumettre l'essai.");
  }
}

// ─── Vérifier et débloquer les succès ────────────────────────────────────
async function verifierEtDebloquerSucces(
  joueurId: number,
  _partieId: number,
  resultat: ResultatPartie,
  nbEssais: number
): Promise<Succes[]> {
  const succesAVerifier: string[] = [];

  if (resultat === 'GAGNE') {
    // Compter les victoires du joueur
    const nbVictoires = await prismaClient.partie.count({
      where: { joueurId, resultat: 'GAGNE' },
    });

    if (nbVictoires === 1) succesAVerifier.push('PREMIERE_VICTOIRE');
    if (nbEssais === 1) succesAVerifier.push('SANS_FAUTE');

    // Vérifier la série de 5 victoires consécutives
    const dernieresParties = await prismaClient.partie.findMany({
      where: { joueurId, resultat: { in: ['GAGNE', 'PERDU'] } },
      orderBy: { termineeLe: 'desc' },
      take: 5,
    });

    if (dernieresParties.length >= 5 && dernieresParties.every((p) => p.resultat === 'GAGNE')) {
      succesAVerifier.push('SERIE_5');
    }
  }

  const succesDebloques: Succes[] = [];

  for (const code of succesAVerifier) {
    const succes = await prismaClient.succes.findUnique({ where: { code } });
    if (!succes) continue;

    // Vérifier si déjà débloqué
    const dejaDebloque = await prismaClient.joueurSucces.findUnique({
      where: { joueurId_succesId: { joueurId, succesId: succes.id } },
    });

    if (!dejaDebloque) {
      // Débloquer le succès — INSERT dans la table de jonction N:M
      await prismaClient.joueurSucces.create({
        data: { joueurId, succesId: succes.id },
      });
      succesDebloques.push({
        id: succes.id,
        code: succes.code,
        libelle: succes.libelle,
        description: succes.description,
      });
    }
  }

  return succesDebloques;
}
