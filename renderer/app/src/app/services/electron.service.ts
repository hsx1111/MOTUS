// ─── Service Electron ─────────────────────────────────────────────────────
// Garde autour de window.api — vérifie que l'app tourne dans Electron
// Notion vue en cours : injection de dépendances Angular (providedIn: 'root')

import { Injectable } from '@angular/core';
import type { ElectronAPI } from '../../../../../shared/electron-api';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  // ─── Vérifie si l'app tourne dans Electron ────────────────────────────
  isElectron(): boolean {
    return typeof window !== 'undefined' && 'api' in window && window.api !== undefined;
  }

  // ─── Retourne l'API Electron (lève une erreur si absent) ─────────────
  getApi(): ElectronAPI {
    if (!this.isElectron()) {
      throw new Error(
        "window.api est absent. L'application doit être lancée dans Electron (npm run start)."
      );
    }
    return window.api;
  }
}
