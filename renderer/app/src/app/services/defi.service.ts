// ─── Service Défi Quotidien ───────────────────────────────────────────────

import { Injectable, signal, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import type { DefiQuotidien } from '../../../../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class DefiService {
  private readonly electronService = inject(ElectronService);

  readonly defiDuJour = signal<DefiQuotidien | null>(null);
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);
  readonly dejaJoue = signal(false);

  async chargerDefiDuJour(): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const defi = await this.electronService.getApi().defiDuJour();
      this.defiDuJour.set(defi);
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : 'Erreur lors du chargement du défi.');
    } finally {
      this.chargement.set(false);
    }
  }

  async verifierDejaJoue(joueurId: number): Promise<void> {
    try {
      const dateAujourdhui = new Date().toISOString().split('T')[0]!;
      const partie = await this.electronService.getApi().partieDefiDuJourJoueur(joueurId, dateAujourdhui);
      this.dejaJoue.set(partie !== null && partie.resultat !== 'EN_COURS');
    } catch {
      this.dejaJoue.set(false);
    }
  }
}
