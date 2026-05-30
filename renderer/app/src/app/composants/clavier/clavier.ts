// ─── Composant Clavier ────────────────────────────────────────────────────
// Clavier virtuel MOTUS
// Notion vue en cours : output<T>() — communication enfant → parent (syntaxe signal)

import { Component, input, output } from '@angular/core';
import type { EtatLettre } from '../../../../../../shared/types';

@Component({
  selector: 'app-clavier',
  standalone: true,
  template: `
    <div class="clavier">
      @for (rangee of rangees; track $index) {
        <div class="rangee">
          @if ($index === 2) {
            <!-- Touches spéciales sur la dernière rangée -->
            <button class="touche touche--speciale" (click)="onSoumettre()">↵</button>
          }

          @for (lettre of rangee; track lettre) {
            <button
              class="touche"
              [class]="'touche--' + (obtenirEtat(lettre))"
              (click)="onLettre(lettre)"
            >
              {{ lettre }}
            </button>
          }

          @if ($index === 2) {
            <button class="touche touche--speciale" (click)="onEffacer()">⌫</button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .clavier {
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
      padding: 0.75rem;
      background-color: var(--couleur-surface);
      border-radius: 12px;
    }

    .rangee {
      display: flex;
      gap: 4px;
    }

    .touche {
      min-width: 36px;
      height: 44px;
      padding: 0 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
      border-radius: 4px;
      background-color: var(--couleur-surface2);
      color: var(--couleur-texte);
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .touche:hover { filter: brightness(1.3); }
    .touche:active { transform: scale(0.95); }

    .touche--speciale {
      min-width: 52px;
      background-color: #34495e;
      font-size: 1rem;
    }

    .touche--CORRECT  { background-color: #c0392b; color: white; }
    .touche--PRESENT  { background-color: #f39c12; color: white; }
    .touche--ABSENT   { background-color: #4a4a4a; color: #888; }
    .touche--VIDE     { background-color: var(--couleur-surface2); }
    .touche--EN_COURS { background-color: var(--couleur-surface2); }
  `],
})
export class Clavier {
  // input() : état des lettres fourni par le parent
  readonly lettresUtilisees = input<Map<string, EtatLettre>>(new Map());

  // output<T>() : communication enfant → parent (syntaxe signal moderne)
  // Équivalent legacy : @Output() touchePressee = new EventEmitter<string>()
  readonly touchePressee = output<string>();
  readonly effacer = output<void>();
  readonly soumettre = output<void>();

  // Disposition AZERTY
  readonly rangees = [
    ['A', 'Z', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['Q', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    ['W', 'X', 'C', 'V', 'B', 'N'],
  ];

  onLettre(lettre: string): void {
    this.touchePressee.emit(lettre);
  }

  onEffacer(): void {
    this.effacer.emit();
  }

  onSoumettre(): void {
    this.soumettre.emit();
  }

  obtenirEtat(lettre: string): EtatLettre {
    return this.lettresUtilisees().get(lettre) ?? 'VIDE';
  }
}
