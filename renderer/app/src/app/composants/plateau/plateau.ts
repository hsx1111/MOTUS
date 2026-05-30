// ─── Composant Plateau ────────────────────────────────────────────────────
// La grille complète du jeu MOTUS
// Notion vue en cours : @for sur des lignes (liste de LigneGrille)

import { Component, input } from '@angular/core';
import { LigneEssai } from '../ligne-essai/ligne-essai';
import type { LigneGrille } from '../../../../../../shared/types';

@Component({
  selector: 'app-plateau',
  standalone: true,
  imports: [LigneEssai],
  template: `
    <div class="plateau">
      @for (ligne of lignes(); track $index) {
        <app-ligne-essai [ligne]="ligne" />
      }
      @empty {
        <p class="plateau-vide">Démarrez une partie pour afficher la grille.</p>
      }
    </div>
  `,
  styles: [`
    .plateau {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
      padding: 1rem;
      background-color: var(--couleur-surface);
      border-radius: 12px;
      box-shadow: var(--ombre);
    }

    .plateau-vide {
      color: var(--couleur-texte-secondaire);
      font-style: italic;
      padding: 2rem;
    }
  `],
})
export class Plateau {
  readonly lignes = input.required<LigneGrille[]>();
}
