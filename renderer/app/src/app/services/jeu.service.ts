// ─── Service de jeu MOTUS ─────────────────────────────────────────────────
// ÉTAT DU JEU : signals + computed + effect
//
// Notion clé pour l'oral :
// - signal() : état mutable réactif (remplace les propriétés simples + EventEmitter)
// - computed() : valeur dérivée d'un ou plusieurs signals (recalculée automatiquement)
// - effect() : réagit à un changement de signal (comme ngOnChanges mais déclaratif)
//
// Différence computed vs effect :
// - computed() RETOURNE une valeur (pas d'effets secondaires)
// - effect() EXÉCUTE une action (effets secondaires : log, IPC, DOM...)

import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import type {
  Partie,
  LigneGrille,
  LettreGrille,
  EtatLettre,
  Difficulte,
} from '../../../../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class JeuService {
  private readonly electronService = inject(ElectronService);

  // ─── État du jeu (signals) ────────────────────────────────────────────
  readonly partieEnCours = signal<Partie | null>(null);
  readonly lignes = signal<LigneGrille[]>([]);
  readonly essaiCourant = signal<string>('');
  readonly messageErreur = signal<string | null>(null);
  readonly messageSucces = signal<string | null>(null);
  readonly chargement = signal(false);
  readonly succesDebloques = signal<string[]>([]);

  // ─── Valeurs dérivées (computed) ──────────────────────────────────────
  // Notion d'oral : computed = SELECT calculé en SQL → recalculé automatiquement

  // La partie est-elle terminée (gagnée ou perdue) ?
  readonly estTerminee = computed(
    () => this.partieEnCours()?.resultat === 'GAGNE' || this.partieEnCours()?.resultat === 'PERDU'
  );

  // Le joueur a-t-il gagné ?
  readonly aGagne = computed(() => this.partieEnCours()?.resultat === 'GAGNE');

  // Nombre d'essais restants
  readonly essaisRestants = computed(() => {
    const partie = this.partieEnCours();
    if (!partie?.mot) return 0;
    const maxEssais = partie.mot.longueur + 1;
    return Math.max(0, maxEssais - partie.nbEssais);
  });

  // Lettres utilisées avec leur meilleur état (pour le clavier virtuel)
  readonly lettresUtilisees = computed<Map<string, EtatLettre>>(() => {
    const carte = new Map<string, EtatLettre>();
    const priorite: Record<EtatLettre, number> = { CORRECT: 3, PRESENT: 2, ABSENT: 1, VIDE: 0, EN_COURS: 0 };

    for (const ligne of this.lignes()) {
      if (!ligne.estSoumise) continue;
      for (const lettre of ligne.lettres) {
        if (lettre.lettre === '') continue;
        const actuel = carte.get(lettre.lettre);
        if (!actuel || priorite[lettre.etat] > priorite[actuel]) {
          carte.set(lettre.lettre, lettre.etat);
        }
      }
    }
    return carte;
  });

  // Longueur du mot cible
  readonly longueurMot = computed(() => this.partieEnCours()?.mot?.longueur ?? 5);

  // ─── Effect : journaliser la fin de partie ────────────────────────────
  // Notion d'oral : effect() = réaction déclarative à un changement de signal
  constructor() {
    effect(() => {
      const partie = this.partieEnCours();
      if (partie?.resultat === 'GAGNE') {
        console.log(`[JeuService] Partie gagnée en ${partie.nbEssais} essai(s) !`);
      } else if (partie?.resultat === 'PERDU') {
        console.log(`[JeuService] Partie perdue. Le mot était : ${partie.mot?.valeur}`);
      }
    });
  }

  // ─── Initialiser une grille vide ─────────────────────────────────────
  private initialiserGrille(longueurMot: number, maxEssais: number, premiereLettreRevele: string): void {
    const nouvellesLignes: LigneGrille[] = [];

    for (let i = 0; i < maxEssais; i++) {
      const lettres: LettreGrille[] = [];
      for (let j = 0; j < longueurMot; j++) {
        // Règle MOTUS : la première lettre est toujours révélée
        lettres.push({
          lettre: j === 0 ? premiereLettreRevele : '',
          etat: j === 0 ? 'CORRECT' : 'VIDE',
        });
      }
      nouvellesLignes.push({
        lettres,
        estSoumise: false,
        estCourante: i === 0,
      });
    }

    this.lignes.set(nouvellesLignes);
    // L'essai courant commence déjà avec la première lettre
    this.essaiCourant.set(premiereLettreRevele);
  }

  // ─── Démarrer une nouvelle partie ────────────────────────────────────
  async demarrerPartie(joueurId: number, difficulte: Difficulte, modeDefi = false): Promise<void> {
    this.chargement.set(true);
    this.messageErreur.set(null);
    this.messageSucces.set(null);
    this.succesDebloques.set([]);

    try {
      const partie = await this.electronService.getApi().partieDemarrer({ joueurId, difficulte, modeDefi });
      this.partieEnCours.set(partie);

      const longueur = partie.mot!.longueur;
      const maxEssais = longueur + 1;
      const premiereLettreRevele = partie.mot!.valeur[0]!.toUpperCase();

      this.initialiserGrille(longueur, maxEssais, premiereLettreRevele);
    } catch (e) {
      this.messageErreur.set(e instanceof Error ? e.message : 'Impossible de démarrer la partie.');
    } finally {
      this.chargement.set(false);
    }
  }

  // ─── Ajouter une lettre à l'essai courant ────────────────────────────
  ajouterLettre(lettre: string): void {
    if (this.estTerminee()) return;
    const longueur = this.longueurMot();
    const courant = this.essaiCourant();
    if (courant.length >= longueur) return;

    const nouvelEssai = courant + lettre.toUpperCase();
    this.essaiCourant.set(nouvelEssai);

    // Mettre à jour la grille visuellement
    this.mettreAJourLigneCourante(nouvelEssai);
  }

  // ─── Effacer la dernière lettre ───────────────────────────────────────
  effacerLettre(): void {
    if (this.estTerminee()) return;
    const courant = this.essaiCourant();
    const partie = this.partieEnCours();
    const premiereLettreRevele = partie?.mot?.valeur[0]?.toUpperCase() ?? '';

    // Ne pas effacer la première lettre (révélée au départ)
    if (courant.length <= 1) return;

    const nouvelEssai = courant.slice(0, -1);
    this.essaiCourant.set(nouvelEssai);
    this.mettreAJourLigneCourante(nouvelEssai);
  }

  // ─── Soumettre l'essai courant ────────────────────────────────────────
  async soumettrEssai(): Promise<void> {
    if (this.estTerminee()) return;

    const partie = this.partieEnCours();
    if (!partie) return;

    const essai = this.essaiCourant();
    const longueur = this.longueurMot();

    // Validation
    if (essai.length !== longueur) {
      this.messageErreur.set(`Le mot doit contenir ${longueur} lettres.`);
      return;
    }
    if (!/^[A-Z]+$/.test(essai)) {
      this.messageErreur.set('Seules les lettres sont autorisées.');
      return;
    }

    this.chargement.set(true);
    this.messageErreur.set(null);

    try {
      const resultat = await this.electronService.getApi().partieSoumettreEssai({
        partieId: partie.id,
        contenu: essai,
      });

      // Mettre à jour la partie
      this.partieEnCours.set(resultat.partie);

      // Mettre à jour la grille avec le feedback
      const feedbackTableau = resultat.essai.feedback.split(',') as EtatLettre[];
      const indexLigne = resultat.essai.indexLigne;

      this.lignes.update((lignes) => {
        const nouvellesLignes = [...lignes];
        // Marquer la ligne soumise avec le feedback
        const ligneActuelle = nouvellesLignes[indexLigne];
        if (ligneActuelle) {
          nouvellesLignes[indexLigne] = {
            lettres: feedbackTableau.map((etat, i) => ({
              lettre: essai[i] ?? '',
              etat,
            })),
            estSoumise: true,
            estCourante: false,
          };
        }
        // Passer à la ligne suivante si la partie continue
        const prochainIndex = indexLigne + 1;
        if (prochainIndex < nouvellesLignes.length && resultat.partie.resultat === 'EN_COURS') {
          const premiereLettreRevele = resultat.partie.mot?.valeur[0]?.toUpperCase() ?? '';
          const prochaineL = nouvellesLignes[prochainIndex];
          if (prochaineL) {
            nouvellesLignes[prochainIndex] = {
              lettres: prochaineL.lettres.map((l, i) => ({
                lettre: i === 0 ? premiereLettreRevele : '',
                etat: i === 0 ? ('CORRECT' as EtatLettre) : ('VIDE' as EtatLettre),
              })),
              estSoumise: false,
              estCourante: true,
            };
          }
        }
        return nouvellesLignes;
      });

      // Réinitialiser l'essai courant avec la première lettre
      const premiereLettreRevele = resultat.partie.mot?.valeur[0]?.toUpperCase() ?? '';
      this.essaiCourant.set(premiereLettreRevele);

      // Messages de fin
      if (resultat.partie.resultat === 'GAGNE') {
        this.messageSucces.set(`🎉 Bravo ! Vous avez trouvé "${resultat.partie.mot?.valeur}" en ${resultat.partie.nbEssais} essai(s) !`);
        if (resultat.succesDebloques.length > 0) {
          this.succesDebloques.set(resultat.succesDebloques.map((s) => s.libelle));
        }
      } else if (resultat.partie.resultat === 'PERDU') {
        this.messageSucces.set(`😞 Perdu ! Le mot était : "${resultat.partie.mot?.valeur}"`);
      }
    } catch (e) {
      this.messageErreur.set(e instanceof Error ? e.message : "Erreur lors de la soumission de l'essai.");
    } finally {
      this.chargement.set(false);
    }
  }

  // ─── Mettre à jour la ligne courante visuellement ────────────────────
  private mettreAJourLigneCourante(essai: string): void {
    const longueur = this.longueurMot();
    const partie = this.partieEnCours();
    const premiereLettreRevele = partie?.mot?.valeur[0]?.toUpperCase() ?? '';

    this.lignes.update((lignes) => {
      const indexCourant = lignes.findIndex((l) => l.estCourante);
      if (indexCourant === -1) return lignes;

      const nouvellesLignes = [...lignes];
      const lettres: LettreGrille[] = [];
      for (let i = 0; i < longueur; i++) {
        const lettre = essai[i] ?? '';
        lettres.push({
          lettre,
          etat: i === 0 && lettre === premiereLettreRevele ? 'CORRECT' : lettre ? 'EN_COURS' : 'VIDE',
        });
      }
      nouvellesLignes[indexCourant] = { lettres, estSoumise: false, estCourante: true };
      return nouvellesLignes;
    });
  }

  // ─── Réinitialiser l'état du jeu ─────────────────────────────────────
  reinitialiser(): void {
    this.partieEnCours.set(null);
    this.lignes.set([]);
    this.essaiCourant.set('');
    this.messageErreur.set(null);
    this.messageSucces.set(null);
    this.succesDebloques.set([]);
  }
}
