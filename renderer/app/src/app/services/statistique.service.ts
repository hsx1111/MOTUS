// ─── Service Statistiques ─────────────────────────────────────────────────
// Notion clé : computed() pour le taux de réussite dérivé des stats

import { Injectable, signal, computed, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import type { StatistiquesJoueur, NombreMotsParTheme } from '../../../../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class StatistiqueService {
  private readonly electronService = inject(ElectronService);

  readonly statistiques = signal<StatistiquesJoueur | null>(null);
  readonly motsParTheme = signal<NombreMotsParTheme[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);

  // computed() : taux de réussite dérivé du signal statistiques
  // Notion d'oral : recalculé automatiquement quand statistiques() change
  readonly tauxReussite = computed(() => {
    const stats = this.statistiques();
    if (!stats) return 0;
    const jouees = stats.partiesGagnees + stats.partiesPerdues;
    return jouees > 0 ? Math.round((stats.partiesGagnees / jouees) * 100) : 0;
  });

  async chargerStatistiques(joueurId: number): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const [stats, themes] = await Promise.all([
        this.electronService.getApi().statistiquesJoueur(joueurId),
        this.electronService.getApi().themeMotsCompte(),
      ]);
      this.statistiques.set(stats);
      this.motsParTheme.set(themes);
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Erreur lors du chargement des statistiques.');
    } finally {
      this.chargement.set(false);
    }
  }
}
