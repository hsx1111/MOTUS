// ─── Composant LigneEssai ─────────────────────────────────────────────────
// Une ligne de la grille MOTUS (contient des TuileLettre)
// Notion vue en cours : @for ... track (liste réactive)

import { Component, input } from '@angular/core';
import { TuileLettre } from '../tuile-lettre/tuile-lettre';
import type { LigneGrille } from '../../../../../../shared/types';

@Component({
  selector: 'app-ligne-essai',
  standalone: true,
  imports: [TuileLettre],
  template: `
    <div class="ligne" [class.ligne--courante]="ligne().estCourante" [class.ligne--soumise]="ligne().estSoumise">
      <!-- @for avec track : optimisation du rendu (comme une clé React) -->
      @for (lettre of ligne().lettres; track $index) {
        <app-tuile-lettre
          [lettre]="lettre.lettre"
          [etat]="lettre.etat"
        />
      }
    </div>
  `,
  styles: [`
    .ligne {
      display: flex;
      gap: 6px;
      padding: 4px;
      border-radius: 6px;
      transition: all 0.15s ease;
    }

    .ligne--courante {
      background-color: rgba(233, 69, 96, 0.05);
      outline: 1px solid rgba(233, 69, 96, 0.2);
    }

    .ligne--soumise {
      animation: soumettre 0.3s ease;
    }

    @keyframes soumettre {
      0% { transform: scale(1); }
      50% { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
  `],
})
export class LigneEssai {
  // input.required<T>() : le composant parent DOIT fournir cette valeur
  readonly ligne = input.required<LigneGrille>();
}
