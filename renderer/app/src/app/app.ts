// ─── Composant racine (shell) ─────────────────────────────────────────────
// Ce composant contient la navigation et le <router-outlet>
// Il ne contient aucune logique métier — délégué aux pages

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly titre = 'MOTUS';
}
