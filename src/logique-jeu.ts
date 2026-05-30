// ─── Logique du jeu MOTUS ─────────────────────────────────────────────────
// Calcul du feedback pour un essai donné
// Cette logique est côté main process pour garantir l'intégrité des résultats

// ─── Calculer le feedback lettre par lettre ───────────────────────────────
// Retourne une chaîne encodée : ex. "CORRECT,PRESENT,ABSENT,CORRECT,ABSENT"
// Algorithme MOTUS (inspiré de Wordle) :
// 1. Passe 1 : marquer les CORRECT (bonne lettre, bonne place)
// 2. Passe 2 : marquer les PRESENT (bonne lettre, mauvaise place) et ABSENT
export function calculerFeedback(essai: string, motCible: string): string {
  const longueur = motCible.length;
  const resultat: ('CORRECT' | 'PRESENT' | 'ABSENT')[] = new Array(longueur).fill('ABSENT');

  // Compteur des lettres restantes dans le mot cible (pour éviter les doublons)
  const lettresRestantes: Map<string, number> = new Map();

  // Passe 1 : identifier les CORRECT
  for (let i = 0; i < longueur; i++) {
    if (essai[i] === motCible[i]) {
      resultat[i] = 'CORRECT';
    } else {
      // Compter les lettres qui ne sont pas encore en position CORRECT
      const lettre = motCible[i]!;
      lettresRestantes.set(lettre, (lettresRestantes.get(lettre) ?? 0) + 1);
    }
  }

  // Passe 2 : identifier les PRESENT
  for (let i = 0; i < longueur; i++) {
    if (resultat[i] === 'CORRECT') continue;

    const lettreEssai = essai[i]!;
    const compteur = lettresRestantes.get(lettreEssai) ?? 0;

    if (compteur > 0) {
      resultat[i] = 'PRESENT';
      lettresRestantes.set(lettreEssai, compteur - 1);
    }
  }

  return resultat.join(',');
}
