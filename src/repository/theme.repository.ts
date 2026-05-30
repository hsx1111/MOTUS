// ─── Repository Theme ─────────────────────────────────────────────────────

import prismaClient from './prisma.client.js';
import type { Theme, NombreMotsParTheme } from '../../shared/types.js';

// ─── Lister tous les thèmes ───────────────────────────────────────────────
// Équivalent SQL : SELECT * FROM themes ORDER BY nom
export async function listerThemes(): Promise<Theme[]> {
  try {
    return await prismaClient.theme.findMany({ orderBy: { nom: 'asc' } });
  } catch (erreur) {
    console.error('[theme.repository] Erreur listerThemes :', erreur);
    throw new Error('Impossible de récupérer les thèmes.');
  }
}

// ─── Compter les mots par thème ───────────────────────────────────────────
// Notion vue en cours : _count sur une relation = COUNT avec GROUP BY en SQL
// Équivalent SQL :
// SELECT themes.*, COUNT(mot_theme.mot_id) AS nombre_mots
// FROM themes LEFT JOIN mot_theme ON themes.id = mot_theme.theme_id
// GROUP BY themes.id ORDER BY themes.nom
export async function nombreMotsParTheme(): Promise<NombreMotsParTheme[]> {
  try {
    const themes = await prismaClient.theme.findMany({
      include: {
        // _count = agrégation SQL : COUNT(*) sur la relation mots
        _count: { select: { mots: true } },
      },
      orderBy: { nom: 'asc' },
    });

    return themes.map((theme) => ({
      theme: { id: theme.id, nom: theme.nom, couleur: theme.couleur },
      nombreMots: theme._count.mots,
    }));
  } catch (erreur) {
    console.error('[theme.repository] Erreur nombreMotsParTheme :', erreur);
    throw new Error('Impossible de compter les mots par thème.');
  }
}
