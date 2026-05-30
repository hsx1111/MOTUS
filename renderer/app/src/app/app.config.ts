// ─── Configuration de l'application Angular ──────────────────────────────
// Notion clé pour l'oral :
//
// withHashLocation() : OBLIGATOIRE sous Electron (protocole file://)
// Sans hash routing, une URL comme file:///app/statistiques serait interprétée
// comme un chemin de fichier → 404. Avec le hash, l'URL devient
// file:///app/index.html#/statistiques → Angular gère le fragment côté client.
//
// provideRouter() + withHashLocation() = équivalent de RouterModule.forRoot()
// avec la stratégie HashLocationStrategy.

import { ApplicationConfig, provideZoneChangeDetection, ErrorHandler } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

// Gestionnaire d'erreurs global pour afficher les erreurs Angular dans la console
class GestionnaireErreurs implements ErrorHandler {
  handleError(erreur: unknown): void {
    console.error('[Angular ErrorHandler]', erreur);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    // Optimisation du cycle de détection de changements
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Routage avec stratégie hash — INDISPENSABLE sous Electron (file://)
    provideRouter(routes, withHashLocation()),
    // Gestionnaire d'erreurs global
    { provide: ErrorHandler, useClass: GestionnaireErreurs },
  ],
};
