// ─── Seed MOTUS ──────────────────────────────────────────────────────────
// Peuplement initial de la base de données
// Idempotent : peut être exécuté plusieurs fois sans duplication

import { PrismaClient, Difficulte } from '@prisma/client';
import * as path from 'path';
// Helpers partagés : date locale + index déterministe
// On importe depuis src/ (chemin relatif, résolu par tsx ou tsc)
import { dateRelative, indexMotPourDate } from '../src/date-locale';

// Configuration du chemin de la base de données.
// On utilise process.cwd() (= racine du projet quand lancé via npm run) plutôt que
// __dirname, car __dirname varie selon le mode d'exécution :
//   • tsx prisma/seed.ts  → __dirname = <racine>/prisma/
//   • node dist/prisma/seed.js → __dirname = <racine>/dist/prisma/
// process.cwd() est toujours la racine du projet dans les deux cas.
process.env['DATABASE_URL'] =
  'file:' + path.join(process.cwd(), 'prisma', 'motus.db');

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Démarrage du seed MOTUS...');

  // ─── Nettoyage initial (idempotence) ─────────────────────────────────
  await prisma.joueurSucces.deleteMany();
  await prisma.essai.deleteMany();
  await prisma.partie.deleteMany();
  await prisma.defiQuotidien.deleteMany();
  await prisma.motTheme.deleteMany();
  await prisma.mot.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.joueur.deleteMany();
  await prisma.succes.deleteMany();

  // ─── Thèmes ───────────────────────────────────────────────────────────
  console.log('📁 Création des thèmes...');
  const themeAnimaux = await prisma.theme.create({ data: { nom: 'Animaux', couleur: '#4CAF50' } });
  const themeNature = await prisma.theme.create({ data: { nom: 'Nature', couleur: '#8BC34A' } });
  const themeAliments = await prisma.theme.create({ data: { nom: 'Aliments', couleur: '#FF9800' } });
  const themeVilles = await prisma.theme.create({ data: { nom: 'Villes', couleur: '#2196F3' } });
  const themeSports = await prisma.theme.create({ data: { nom: 'Sports', couleur: '#E91E63' } });
  const themeMusique = await prisma.theme.create({ data: { nom: 'Musique', couleur: '#9C27B0' } });

  // ─── Mots (≥ 30, répartis sur 3 difficultés) ─────────────────────────
  console.log('📝 Création des mots...');

  // FACILE (4-5 lettres)
  const motsFaciles = [
    { valeur: 'CHAT', longueur: 4, definition: 'Félin domestique' },
    { valeur: 'CHIEN', longueur: 5, definition: 'Canidé domestique' },
    { valeur: 'LOUP', longueur: 4, definition: 'Grand canidé sauvage' },
    { valeur: 'OURS', longueur: 4, definition: 'Grand mammifère plantigrade' },
    { valeur: 'AIGLE', longueur: 5, definition: 'Grand rapace diurne' },
    { valeur: 'ARBRE', longueur: 5, definition: 'Végétal ligneux' },
    { valeur: 'FLEUR', longueur: 5, definition: 'Organe reproducteur des plantes' },
    { valeur: 'PIZZA', longueur: 5, definition: 'Plat italien à base de pâte' },
    { valeur: 'SPORT', longueur: 5, definition: 'Activité physique et compétitive' },
  ];

  // MOYEN (6-7 lettres)
  const motsMoyens = [
    { valeur: 'REQUIN', longueur: 6, definition: 'Grand poisson cartilagineux prédateur' },
    { valeur: 'TIGRE', longueur: 5, definition: 'Grand félin prédateur' }, 
    { valeur: 'GIRAFE', longueur: 6, definition: 'Grand mammifère au long cou' },
    { valeur: 'BALLON', longueur: 6, definition: 'Sphère gonflable utilisée en sport' },
    { valeur: 'JARDIN', longueur: 6, definition: 'Espace cultivé autour d\'une maison' },
    { valeur: 'MOUTON', longueur: 6, definition: 'Ruminant domestique à laine' },
    { valeur: 'SOLEIL', longueur: 6, definition: 'Étoile du système solaire' },
    { valeur: 'MUSIQUE', longueur: 7, definition: 'Art des sons organisés' },
    { valeur: 'RIVIERE', longueur: 7, definition: 'Cours d\'eau naturel' },
    { valeur: 'POISSON', longueur: 7, definition: 'Animal aquatique à nageoires' },
  ];

  // DIFFICILE (8+ lettres)
  const motsDifficiles = [
    { valeur: 'ELEPHANT', longueur: 8, definition: 'Plus grand mammifère terrestre' },
    { valeur: 'PIRANHA', longueur: 7, definition: 'Poisson qui fait peur dans les films la' }, // #blague
    { valeur: 'FOOTBALL', longueur: 8, definition: 'Sport collectif avec un ballon rond' },
    { valeur: 'MONTAGNE', longueur: 8, definition: 'Relief terrestre élevé' },
    { valeur: 'FRAMBOISE', longueur: 9, definition: 'Petit fruit rouge acidulé' },
    { valeur: 'TOURNESOL', longueur: 9, definition: 'Grande fleur jaune qui suit le soleil' },
    { valeur: 'CROCODILE', longueur: 9, definition: 'Grand reptile aquatique' },
    { valeur: 'PRINTEMPS', longueur: 9, definition: 'Saison entre l\'hiver et l\'été' },
    { valeur: 'TROMPETTE', longueur: 9, definition: 'Instrument à vent en cuivre' },
    { valeur: 'BALEINE', longueur: 7, definition: 'Plus grand mammifère marin' },
  ];

  const motsCrees: { [valeur: string]: { id: number; difficulte: Difficulte } } = {};

  for (const mot of motsFaciles) {
    const cree = await prisma.mot.create({
      data: { ...mot, difficulte: Difficulte.FACILE },
    });
    motsCrees[cree.valeur] = { id: cree.id, difficulte: Difficulte.FACILE };
  }

  for (const mot of motsMoyens) {
    // On refiltre pour n'avoir que des mots de 6-7 lettres en MOYEN
    const diff = mot.longueur <= 7 && mot.longueur >= 6 ? Difficulte.MOYEN : Difficulte.FACILE;
    const cree = await prisma.mot.create({
      data: { ...mot, difficulte: diff },
    });
    motsCrees[cree.valeur] = { id: cree.id, difficulte: diff };
  }

  for (const mot of motsDifficiles) {
    const diff = mot.longueur >= 8 ? Difficulte.DIFFICILE : Difficulte.MOYEN;
    const cree = await prisma.mot.create({
      data: { ...mot, difficulte: diff },
    });
    motsCrees[cree.valeur] = { id: cree.id, difficulte: diff };
  }

  // ─── Liaisons MotTheme (N:M) ──────────────────────────────────────────
  console.log('🔗 Création des liaisons mots-thèmes...');

  const liaisonsAnimaux = ['CHAT', 'CHIEN', 'LOUP', 'OURS', 'AIGLE', 'REQUIN', 'GIRAFE', 'MOUTON', 'POISSON', 'ELEPHANT', 'CROCODILE', 'BALEINE'];
  const liaisonsNature = ['ARBRE', 'FLEUR', 'SOLEIL', 'RIVIERE', 'MONTAGNE', 'TOURNESOL', 'PRINTEMPS'];
  const liaisonsAliments = ['PIZZA', 'FRAMBOISE'];
  const liaisonsSports = ['SPORT', 'BALLON', 'FOOTBALL'];
  const liaisonsMusique = ['MUSIQUE', 'TROMPETTE'];

  for (const valeur of liaisonsAnimaux) {
    if (motsCrees[valeur]) {
      await prisma.motTheme.create({
        data: { motId: motsCrees[valeur]!.id, themeId: themeAnimaux.id },
      });
    }
  }
  for (const valeur of liaisonsNature) {
    if (motsCrees[valeur]) {
      await prisma.motTheme.create({
        data: { motId: motsCrees[valeur]!.id, themeId: themeNature.id },
      });
    }
  }
  for (const valeur of liaisonsAliments) {
    if (motsCrees[valeur]) {
      await prisma.motTheme.create({
        data: { motId: motsCrees[valeur]!.id, themeId: themeAliments.id },
      });
    }
  }
  for (const valeur of liaisonsSports) {
    if (motsCrees[valeur]) {
      await prisma.motTheme.create({
        data: { motId: motsCrees[valeur]!.id, themeId: themeSports.id },
      });
    }
  }
  for (const valeur of liaisonsMusique) {
    if (motsCrees[valeur]) {
      await prisma.motTheme.create({
        data: { motId: motsCrees[valeur]!.id, themeId: themeMusique.id },
      });
    }
  }

  // ─── Défis quotidiens ─────────────────────────────────────────────────
  // Plage : aujourd'hui -7j → aujourd'hui +28j (35 jours au total)
  // Chaque date reçoit un mot choisi de façon DÉTERMINISTE :
  //   index = hash(date) % nb_mots  →  même date = même mot pour tous les joueurs
  // Idempotent : upsert par date (clé unique), relancer ne crée pas de doublons.
  console.log('📅 Création des défis quotidiens (-7j → +28j)...');

  // Récupérer tous les ids de mots triés par id (ordre stable et reproductible)
  // Équivalent SQL : SELECT id FROM mots ORDER BY id
  const tousMotsIds = await prisma.mot.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
  });

  const JOURS_PASSES = 7;
  const JOURS_FUTURS = 28;

  for (let delta = -JOURS_PASSES; delta <= JOURS_FUTURS; delta++) {
    const dateStr = dateRelative(delta);
    const index = indexMotPourDate(dateStr, tousMotsIds.length);
    const motId = tousMotsIds[index]!.id;

    // upsert : crée ou met à jour si la date existe déjà
    // Équivalent SQL : INSERT … ON CONFLICT (date) DO UPDATE SET mot_id = ?
    await prisma.defiQuotidien.upsert({
      where: { date: dateStr },
      create: { date: dateStr, motId },
      update: { motId },
    });
  }
  console.log(`   → ${JOURS_PASSES + JOURS_FUTURS + 1} défis créés/mis à jour.`);

  // ─── Succès ───────────────────────────────────────────────────────────
  console.log('🏆 Création des succès...');
  await prisma.succes.createMany({
    data: [
      { code: 'PREMIERE_VICTOIRE', libelle: 'Première victoire !', description: 'Gagner sa première partie' },
      { code: 'SANS_FAUTE', libelle: 'Sans faute !', description: 'Trouver le mot du premier coup' },
      { code: 'SERIE_5', libelle: 'Série de 5 !', description: 'Gagner 5 parties consécutives' },
      { code: 'EXPLORATEUR', libelle: 'Explorateur', description: 'Jouer sur les 3 difficultés' },
    ],
  });

  // ─── Joueurs de démonstration ─────────────────────────────────────────
  console.log('👤 Création des joueurs de démonstration...');
  const joueur1 = await prisma.joueur.create({ data: { pseudo: 'Marie' } });
  const joueur2 = await prisma.joueur.create({ data: { pseudo: 'Thomas' } });

  // ─── Parties et essais de démonstration (pour que l'historique ne soit pas vide) ─
  console.log('🎮 Création des parties de démonstration...');

  const motChat = motsCrees['CHAT'];
  const motChien = motsCrees['CHIEN'];
  const motArbre = motsCrees['ARBRE'];

  if (motChat && motChien && motArbre) {
    // Partie gagnée de Marie
    const partie1 = await prisma.partie.create({
      data: {
        joueurId: joueur1.id,
        motId: motChat.id,
        difficulte: Difficulte.FACILE,
        resultat: 'GAGNE',
        nbEssais: 3,
        commenceeLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        termineeLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
      },
    });
    await prisma.essai.createMany({
      data: [
        { partieId: partie1.id, contenu: 'CHIC', indexLigne: 0, feedback: 'CORRECT,ABSENT,ABSENT,PRESENT', creeLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { partieId: partie1.id, contenu: 'CAGE', indexLigne: 1, feedback: 'CORRECT,PRESENT,ABSENT,ABSENT', creeLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60000) },
        { partieId: partie1.id, contenu: 'CHAT', indexLigne: 2, feedback: 'CORRECT,CORRECT,CORRECT,CORRECT', creeLe: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000) },
      ],
    });

    // Partie perdue de Marie
    const partie2 = await prisma.partie.create({
      data: {
        joueurId: joueur1.id,
        motId: motChien.id,
        difficulte: Difficulte.FACILE,
        resultat: 'PERDU',
        nbEssais: 6,
        commenceeLe: new Date(Date.now() - 24 * 60 * 60 * 1000),
        termineeLe: new Date(Date.now() - 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
      },
    });
    await prisma.essai.createMany({
      data: [
        { partieId: partie2.id, contenu: 'ARBRE', indexLigne: 0, feedback: 'ABSENT,ABSENT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
        { partieId: partie2.id, contenu: 'FLEUR', indexLigne: 1, feedback: 'ABSENT,ABSENT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
        { partieId: partie2.id, contenu: 'PIZZA', indexLigne: 2, feedback: 'ABSENT,ABSENT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
        { partieId: partie2.id, contenu: 'SPORT', indexLigne: 3, feedback: 'ABSENT,ABSENT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
        { partieId: partie2.id, contenu: 'AIGLE', indexLigne: 4, feedback: 'ABSENT,ABSENT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
        { partieId: partie2.id, contenu: 'TROUT', indexLigne: 5, feedback: 'ABSENT,ABSENT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
      ],
    });

    // Partie gagnée de Thomas
    const partie3 = await prisma.partie.create({
      data: {
        joueurId: joueur2.id,
        motId: motArbre.id,
        difficulte: Difficulte.FACILE,
        resultat: 'GAGNE',
        nbEssais: 2,
        commenceeLe: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        termineeLe: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000),
      },
    });
    await prisma.essai.createMany({
      data: [
        { partieId: partie3.id, contenu: 'ARGLE', indexLigne: 0, feedback: 'CORRECT,CORRECT,ABSENT,ABSENT,ABSENT', creeLe: new Date() },
        { partieId: partie3.id, contenu: 'ARBRE', indexLigne: 1, feedback: 'CORRECT,CORRECT,CORRECT,CORRECT,CORRECT', creeLe: new Date() },
      ],
    });

    // Débloquer la PREMIERE_VICTOIRE pour Marie et Thomas
    const succesVictoire = await prisma.succes.findUnique({ where: { code: 'PREMIERE_VICTOIRE' } });
    if (succesVictoire) {
      await prisma.joueurSucces.createMany({
        data: [
          { joueurId: joueur1.id, succesId: succesVictoire.id },
          { joueurId: joueur2.id, succesId: succesVictoire.id },
        ],
      });
    }
  }

  console.log('✅ Seed terminé avec succès !');
  console.log(`   - ${Object.keys(motsCrees).length} mots créés`);
  console.log('   - 6 thèmes créés');
  console.log(`   - ${JOURS_PASSES + JOURS_FUTURS + 1} défis quotidiens créés (-${JOURS_PASSES}j → +${JOURS_FUTURS}j)`);
  console.log('   - 4 succès créés');
  console.log('   - 2 joueurs de démonstration créés');
}

main()
  .catch((erreur) => {
    console.error('❌ Erreur lors du seed :', erreur);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
