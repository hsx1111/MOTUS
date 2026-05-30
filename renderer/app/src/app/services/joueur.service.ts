// ─── Service Joueur ───────────────────────────────────────────────────────
// Gestion du CRUD joueurs via IPC
// Notion vue en cours : signal() pour l'état réactif, inject() pour la DI

import { Injectable, signal, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import type { Joueur } from '../../../../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class JoueurService {
  private readonly electronService = inject(ElectronService);

  // ─── État réactif (signals) ───────────────────────────────────────────
  readonly joueurs = signal<Joueur[]>([]);
  readonly joueurActif = signal<Joueur | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);

  // ─── Charger tous les joueurs ─────────────────────────────────────────
  async chargerJoueurs(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const liste = await this.electronService.getApi().joueurLister();
      this.joueurs.set(liste);
      // Sélectionner automatiquement le premier joueur si aucun n'est actif
      if (!this.joueurActif() && liste.length > 0) {
        this.joueurActif.set(liste[0]!);
      }
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Erreur lors du chargement des joueurs.');
    } finally {
      this.chargement.set(false);
    }
  }

  // ─── Créer un joueur ─────────────────────────────────────────────────
  async creerJoueur(pseudo: string): Promise<Joueur> {
    this.erreur.set(null);
    try {
      const joueur = await this.electronService.getApi().joueurCreer({ pseudo });
      this.joueurs.update((liste) => [joueur, ...liste]);
      return joueur;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur lors de la création du joueur.';
      this.erreur.set(msg);
      throw new Error(msg);
    }
  }

  // ─── Modifier un joueur ──────────────────────────────────────────────
  async modifierJoueur(id: number, pseudo: string): Promise<void> {
    this.erreur.set(null);
    try {
      const joueurMaj = await this.electronService.getApi().joueurModifier({ id, pseudo });
      this.joueurs.update((liste) =>
        liste.map((j) => (j.id === id ? joueurMaj : j))
      );
      if (this.joueurActif()?.id === id) {
        this.joueurActif.set(joueurMaj);
      }
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Erreur lors de la modification.');
    }
  }

  // ─── Supprimer un joueur ─────────────────────────────────────────────
  async supprimerJoueur(id: number): Promise<void> {
    this.erreur.set(null);
    try {
      await this.electronService.getApi().joueurSupprimer(id);
      this.joueurs.update((liste) => liste.filter((j) => j.id !== id));
      if (this.joueurActif()?.id === id) {
        const restants = this.joueurs();
        this.joueurActif.set(restants.length > 0 ? restants[0]! : null);
      }
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Erreur lors de la suppression.');
    }
  }

  // ─── Sélectionner le joueur actif ────────────────────────────────────
  selectionnerJoueur(joueur: Joueur): void {
    this.joueurActif.set(joueur);
  }
}
