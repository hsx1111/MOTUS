// ─── Page Historique ──────────────────────────────────────────────────────
// Affiche les parties passées avec filtre par résultat
// Notion vue en cours : @for / @if / @empty + signal()

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { PartieService } from '../../services/partie.service';
import { JoueurService } from '../../services/joueur.service';
// L'historique n'affiche que les parties terminées : le type de filtre
// exclut 'EN_COURS' qui n'apparaît plus dans les données renvoyées.
import type { ResultatPartie } from '../../../../../../shared/types';

type FiltreHistorique = Exclude<ResultatPartie, 'EN_COURS'> | 'TOUS';

@Component({
  selector: 'app-historique',
  standalone: true,
  templateUrl: './historique.html',
  styleUrl: './historique.css',
})
export class Historique implements OnInit {
  protected readonly partieService = inject(PartieService);
  protected readonly joueurService = inject(JoueurService);

  protected readonly filtreResultat = signal<FiltreHistorique>('TOUS');

  // Seules les parties terminées apparaissent — pas de filtre EN_COURS
  protected readonly filtresDisponibles: { valeur: FiltreHistorique; libelle: string }[] = [
    { valeur: 'TOUS', libelle: 'Tous terminés' },
    { valeur: 'GAGNE', libelle: '✅ Gagnés' },
    { valeur: 'PERDU', libelle: '❌ Perdus' },
  ];

  // computed() : filtre les parties selon le signal filtreResultat
  protected readonly partiesFiltrees = computed(() => {
    const filtre = this.filtreResultat();
    const parties = this.partieService.historique();
    if (filtre === 'TOUS') return parties;
    return parties.filter((p) => p.resultat === filtre);
  });

  async ngOnInit(): Promise<void> {
    const joueur = this.joueurService.joueurActif();
    if (joueur) {
      await this.partieService.chargerHistorique(joueur.id);
    }
  }

  changerFiltre(filtre: FiltreHistorique): void {
    this.filtreResultat.set(filtre);
  }

  formaterDate(date: Date): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
