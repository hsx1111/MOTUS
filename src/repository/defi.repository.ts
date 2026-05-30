// ─── Repository Défi Quotidien ────────────────────────────────────────────
// Gestion du mot du jour

import prismaClient from './prisma.client.js';
import type { DefiQuotidien } from '../../shared/types.js';

// ─── Récupérer le défi du jour ────────────────────────────────────────────
// Notion vue en cours : findUnique avec include = JOIN en SQL
// Équivalent SQL :
// SELECT d.*, m.*, mt.*, t.*
// FROM defis_quotidiens d
// JOIN mots m ON d.mot_id = m.id
// LEFT JOIN mot_theme mt ON m.id = mt.mot_id
// LEFT JOIN themes t ON mt.theme_id = t.id
// WHERE d.date = ?
export async function defiDuJour(date: string): Promise<DefiQuotidien | null> {
  try {
    const defi = await prismaClient.defiQuotidien.findUnique({
      where: { date },
      include: {
        mot: {
          include: {
            // JOIN vers les thèmes via la table de jonction MotTheme
            themes: {
              include: { theme: true },
            },
          },
        },
      },
    });

    if (!defi) return null;

    return {
      id: defi.id,
      date: defi.date,
      motId: defi.motId,
      mot: defi.mot
        ? {
            id: defi.mot.id,
            valeur: defi.mot.valeur,
            longueur: defi.mot.longueur,
            difficulte: defi.mot.difficulte as import('../../shared/types.js').Difficulte,
            definition: defi.mot.definition,
          }
        : undefined,
    };
  } catch (erreur) {
    console.error('[defi.repository] Erreur defiDuJour :', erreur);
    throw new Error(`Impossible de récupérer le défi du ${date}.`);
  }
}
