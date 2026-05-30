// ─── Page Statistiques ────────────────────────────────────────────────────

import { Component, OnInit, inject } from '@angular/core';
import { StatistiqueService } from '../../services/statistique.service';
import { JoueurService } from '../../services/joueur.service';

@Component({
  selector: 'app-statistiques',
  standalone: true,
  templateUrl: './statistiques.html',
  styleUrl: './statistiques.css',
})
export class Statistiques implements OnInit {
  protected readonly statService = inject(StatistiqueService);
  protected readonly joueurService = inject(JoueurService);

  async ngOnInit(): Promise<void> {
    const joueur = this.joueurService.joueurActif();
    if (joueur) {
      await this.statService.chargerStatistiques(joueur.id);
    }
  }

  largeurBarre(nombreParties: number): string {
    const stats = this.statService.statistiques();
    if (!stats || stats.partiesGagnees === 0) return '0%';
    const max = Math.max(...stats.repartitionEssais.map((r) => r.nombreParties));
    return `${Math.round((nombreParties / max) * 100)}%`;
  }
}
