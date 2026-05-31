// ─── Helper de date locale ────────────────────────────────────────────────
// Retourne la date d'AUJOURD'HUI au format 'AAAA-MM-JJ' en heure LOCALE.
//
// Pourquoi ne pas utiliser new Date().toISOString() ?
// toISOString() renvoie toujours l'heure UTC. Près de minuit, la date UTC peut
// être différente de la date locale (ex. 23h30 à Paris en hiver = 22h30 UTC
// = encore hier en UTC). Cela crée un décalage "off-by-one" : le seed crée
// un défi pour "aujourd'hui" en heure locale, mais le handler IPC cherche
// "aujourd'hui" en UTC → aucun défi trouvé pendant 1–2 heures autour de minuit.
//
// Notion vue en cours : même problème qu'un SELECT avec un WHERE sur DATE()
// en SQL — il faut s'assurer que la fonction de date côté applicatif correspond
// à la fonction de date côté base (ici stockée comme TEXT 'AAAA-MM-JJ').

export function dateDuJourLocale(reference?: Date): string {
  const maintenant = reference ?? new Date();

  const annee = maintenant.getFullYear();
  // getMonth() renvoie 0-11 → +1 pour avoir 1-12
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');

  return `${annee}-${mois}-${jour}`;
}

// ─── Calculer une date relative à aujourd'hui ─────────────────────────────
// Utile dans le seed pour générer la plage -7j…+28j.
export function dateRelative(joursDelta: number, reference?: Date): string {
  const base = reference ?? new Date();
  const cible = new Date(base);
  // setDate gère automatiquement les débordements de mois/année
  cible.setDate(base.getDate() + joursDelta);
  return dateDuJourLocale(cible);
}

// ─── Choisir un mot de façon déterministe à partir d'une date ────────────
// Règle : hash simple de la chaîne de date → index = somme des codes char modulo N.
// Propriété : même date → même index → même mot, pour tous les joueurs et
// tous les serveurs, indépendamment du moment où le seed a été lancé.
// Équivalent SQL d'une règle stable : ABS(CHECKSUM('AAAA-MM-JJ')) % COUNT(mots)
export function indexMotPourDate(dateStr: string, nombreMots: number): number {
  let somme = 0;
  for (let i = 0; i < dateStr.length; i++) {
    somme += dateStr.charCodeAt(i);
  }
  return somme % nombreMots;
}
