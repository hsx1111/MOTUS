// ─── Page Jeu ─────────────────────────────────────────────────────────────
// Route : /jouer
// Intègre le plateau de jeu, le clavier, et gère les interactions utilisateur

import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JeuService } from '../../services/jeu.service';
import { JoueurService } from '../../services/joueur.service';
import { Plateau } from '../../composants/plateau/plateau';
import { Clavier } from '../../composants/clavier/clavier';
import type { Difficulte } from '../../../../../../shared/types';

@Component({
  selector: 'app-jeu',
  standalone: true,
  imports: [Plateau, Clavier, RouterLink],
  templateUrl: './jeu.html',
  styleUrl: './jeu.css',
})
export class Jeu implements OnInit {
  protected readonly jeuService = inject(JeuService);
  protected readonly joueurService = inject(JoueurService);

  protected readonly difficulteChoisie = signal<Difficulte>('FACILE');
  protected readonly modeDefi = signal(false);

  protected readonly difficultes: { valeur: Difficulte; libelle: string }[] = [
    { valeur: 'FACILE', libelle: '🟢 4-5 lettres' },
    { valeur: 'MOYEN', libelle: '🟡 6-7 lettres' },
    { valeur: 'DIFFICILE', libelle: '🔴 8+ lettres' },
  ];

  async ngOnInit(): Promise<void> {
    await this.joueurService.chargerJoueurs();
  }

  async demarrerPartie(): Promise<void> {
    const joueur = this.joueurService.joueurActif();
    if (!joueur) return;
    await this.jeuService.demarrerPartie(joueur.id, this.difficulteChoisie(), this.modeDefi());
  }

  // ─── Clavier physique ────────────────────────────────────────────────────
  // Notion vue en cours : @HostListener — écouteur d'événement DOM lié au cycle
  // de vie du composant (retiré automatiquement quand on quitte la route).
  // 'document:keydown' capture les touches même si aucun élément n'est focalisé.
  @HostListener('document:keydown', ['$event'])
  onToucheClavier(event: KeyboardEvent): void {
    // Ignorer si le focus est dans un champ de saisie (évite les conflits avec les formulaires)
    const cible = event.target as HTMLElement;
    if (
      cible instanceof HTMLInputElement ||
      cible instanceof HTMLTextAreaElement ||
      cible instanceof HTMLSelectElement ||
      cible.isContentEditable
    ) return;

    // Ignorer les touches avec modificateur (Ctrl+Z, Alt+..., etc.)
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    // Ignorer si aucune partie en cours
    if (!this.jeuService.partieEnCours()) return;

    const touche = event.key;

    if (touche === 'Enter') {
      event.preventDefault();
      this.jeuService.soumettrEssai();
    } else if (touche === 'Backspace') {
      event.preventDefault();
      this.jeuService.effacerLettre();
    } else if (touche.length === 1) {
      // Normalise : majuscule + suppression des diacritiques (U+0300–U+036F)
      // ex. 'é' → 'E', 'à' → 'A' (décomposition NFD puis retrait des combinants)
      const lettre = touche
        .toUpperCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
      if (/^[A-Z]$/.test(lettre)) {
        event.preventDefault();
        this.jeuService.ajouterLettre(lettre);
      }
    }
  }

  // ─── Délégation vers le service (même logique que le clavier physique) ──
  onTouchePressee(lettre: string): void {
    this.jeuService.ajouterLettre(lettre);
  }

  onEffacer(): void {
    this.jeuService.effacerLettre();
  }

  async onSoumettre(): Promise<void> {
    await this.jeuService.soumettrEssai();
  }

  changerDifficulte(difficulte: Difficulte): void {
    this.difficulteChoisie.set(difficulte);
  }

  toggleModeDefi(): void {
    this.modeDefi.update((v) => !v);
  }

  nouvellePartie(): void {
    this.jeuService.reinitialiser();
  }
}

