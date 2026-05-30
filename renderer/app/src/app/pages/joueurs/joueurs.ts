// ─── Page Joueurs ─────────────────────────────────────────────────────────
// CRUD complet avec ReactiveForm
// Notion vue en cours : FormBuilder + Validators + messages d'erreur

import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { JoueurService } from '../../services/joueur.service';
import type { Joueur } from '../../../../../../shared/types';

@Component({
  selector: 'app-joueurs',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './joueurs.html',
  styleUrl: './joueurs.css',
})
export class Joueurs implements OnInit {
  protected readonly joueurService = inject(JoueurService);
  private readonly fb = inject(FormBuilder);

  // ReactiveForm avec validation
  protected readonly formulaire = this.fb.group({
    pseudo: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-ZÀ-ÿ0-9_-]+$/),
      ],
    ],
  });

  protected readonly joueurEnEdition = signal<Joueur | null>(null);
  protected readonly joueurASupprimer = signal<Joueur | null>(null);
  protected readonly messageSucces = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    await this.joueurService.chargerJoueurs();
  }

  async soumettre(): Promise<void> {
    if (this.formulaire.invalid) return;

    const pseudo = this.formulaire.value.pseudo!.trim();
    this.messageSucces.set(null);

    try {
      const joueurEdition = this.joueurEnEdition();
      if (joueurEdition) {
        await this.joueurService.modifierJoueur(joueurEdition.id, pseudo);
        this.messageSucces.set(`Joueur "${pseudo}" modifié avec succès.`);
        this.annulerEdition();
      } else {
        const nouveauJoueur = await this.joueurService.creerJoueur(pseudo);
        this.messageSucces.set(`Joueur "${nouveauJoueur.pseudo}" créé avec succès.`);
        this.formulaire.reset();
      }
    } catch {
      // L'erreur est déjà dans joueurService.erreur()
    }
  }

  editer(joueur: Joueur): void {
    this.joueurEnEdition.set(joueur);
    this.formulaire.setValue({ pseudo: joueur.pseudo });
    this.messageSucces.set(null);
  }

  annulerEdition(): void {
    this.joueurEnEdition.set(null);
    this.formulaire.reset();
  }

  demanderSuppression(joueur: Joueur): void {
    this.joueurASupprimer.set(joueur);
  }

  annulerSuppression(): void {
    this.joueurASupprimer.set(null);
  }

  async confirmerSuppression(): Promise<void> {
    const joueur = this.joueurASupprimer();
    if (!joueur) return;
    await this.joueurService.supprimerJoueur(joueur.id);
    this.joueurASupprimer.set(null);
    this.messageSucces.set(`Joueur "${joueur.pseudo}" supprimé.`);
  }

  selectionner(joueur: Joueur): void {
    this.joueurService.selectionnerJoueur(joueur);
    this.messageSucces.set(`Joueur "${joueur.pseudo}" sélectionné comme joueur actif.`);
  }
}
