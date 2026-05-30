// ─── Service Partie ───────────────────────────────────────────────────────

import { Injectable, signal, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import type { Partie } from '../../../../../shared/types';

@Injectable({
  providedIn: 'root',
})
export class PartieService {
  private readonly electronService = inject(ElectronService);

  readonly historique = signal<Partie[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);

  async chargerHistorique(joueurId: number): Promise<void> {
    this.chargement.set(true);
    this.erreur.set(null);
    try {
      const parties = await this.electronService.getApi().partieHistorique(joueurId);
      this.historique.set(parties);
    } catch (e) {
      this.erreur.set(e instanceof Error ? e.message : "Erreur lors du chargement de l'historique.");
    } finally {
      this.chargement.set(false);
    }
  }
}
