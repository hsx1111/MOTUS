// ─── Composant TuileLettre ────────────────────────────────────────────────
// Une case lettre dans la grille MOTUS
// Notion vue en cours : input.required<T>() — syntaxe signal moderne (pas @Input())

import { Component, input } from '@angular/core';
import type { EtatLettre } from '../../../../../../shared/types';

@Component({
  selector: 'app-tuile-lettre',
  standalone: true,
  template: `
    <div class="tuile" [class]="'tuile--' + etat()">
      {{ lettre() }}
    </div>
  `,
  styles: [`
    .tuile {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      font-weight: 900;
      border-radius: 4px;
      border: 2px solid transparent;
      color: white;
      text-transform: uppercase;
      transition: all 0.2s ease;
      letter-spacing: 0;
    }

    .tuile--CORRECT  { background-color: #c0392b; border-color: #922b21; }
    .tuile--PRESENT  { background-color: #f39c12; border-color: #d68910; }
    .tuile--ABSENT   { background-color: #7f8c8d; border-color: #616a6b; }
    .tuile--VIDE     { background-color: #2c3e50; border-color: #34495e; }
    .tuile--EN_COURS { background-color: #2c3e50; border-color: #e94560; border-width: 2px; }
  `],
})
export class TuileLettre {
  // input.required<T>() = syntaxe signal moderne (obligatoire)
  // Équivalent legacy : @Input() lettre!: string
  readonly lettre = input.required<string>();
  readonly etat = input.required<EtatLettre>();
}
