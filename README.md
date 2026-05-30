# Application MOTUS — Electron + Angular + Prisma + SQLite

Jeu de mots français façon Wordle, application de bureau développée avec Electron, Angular 21, Prisma 6 et SQLite.

---

## Prérequis

- Node.js ≥ 18
- npm ≥ 9
- Angular CLI (optionnel pour le développement) : `npm install -g @angular/cli`

---

## Installation et lancement

### Première installation (à partir de zéro)

```bash
# 1. Installer les dépendances racine (inclut tsx, electron, prisma…)
npm install

# 2. Générer le client Prisma (types TypeScript pour @prisma/client)
npm run db:generate

# 3. Créer la base SQLite, appliquer les migrations ET peupler automatiquement
#    → db:migrate déclenche le seed automatiquement via la commande
#      "prisma.seed" du package.json ("npx tsx prisma/seed.ts")
#    → L'étape db:seed manuelle n'est donc PAS nécessaire après db:migrate
npm run db:migrate

# 4. Lancer l'application (compile Electron + Angular, puis ouvre la fenêtre)
npm run start
```

> **Pourquoi `tsx` pour le seed ?**
> Prisma 6 exécute la commande seed via `spawn` sans shell, ce qui rend les opérateurs
> shell (`&&`) inopérants sur toutes les plateformes. `tsx` exécute directement le fichier
> `.ts` sans étape de compilation séparée : une seule commande, zéro shell operator,
> cross-platform (macOS / Windows / Linux).

### Démarrage rapide (après première installation)

```bash
npm run start
```

### Réinitialisation complète (reset propre)

```bash
# Supprimer la base, les artefacts compilés et les modules
rm -rf prisma/motus.db dist node_modules   # macOS/Linux
# ou sous Windows PowerShell :
# Remove-Item prisma/motus.db, dist, node_modules -Recurse -Force

# Puis relancer le cycle complet
npm install
npm run db:generate
npm run db:migrate   # recréé la DB + applique les migrations + seed automatique
npm run start
```

### Re-seed seul (sans recréer la base)

```bash
# Utile pour réinitialiser les données sans toucher aux migrations
npm run db:seed
```

---

## Scripts npm

| Script | Description |
|--------|-------------|
| `npm run start` | Build complet (Electron + Angular) et lance l'app |
| `npm run build` | Build Electron (tsc) + Angular (ng build) |
| `npm run build:electron` | Compile uniquement TypeScript/Electron |
| `npm run build:angular` | Build uniquement Angular |
| `npm run start:dev` | Lance Electron sans rebuild (après un build) |
| `npm run db:migrate` | Crée/migre la base SQLite **+ seed automatique** |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:seed` | Peuple la base manuellement (optionnel après migrate) |
| `npm run db:studio` | Ouvre Prisma Studio (interface visuelle) |

---

## Arborescence commentée

```
motus-electron-angular-prisma/
├── src/                     # Main process (Node.js / Electron)
│   ├── main.ts              # BrowserWindow + handlers IPC (pas de requêtes Prisma)
│   ├── preload.ts           # Pont contextBridge → window.api
│   ├── logique-jeu.ts       # Calcul du feedback MOTUS (côté serveur)
│   └── repository/          # Pattern Repository — toutes les requêtes Prisma
│       ├── prisma.client.ts # Singleton PrismaClient
│       ├── joueur.repository.ts
│       ├── mot.repository.ts
│       ├── theme.repository.ts
│       ├── defi.repository.ts
│       ├── partie.repository.ts
│       ├── essai.repository.ts
│       └── statistique.repository.ts
├── shared/                  # Types partagés (main + preload + Angular)
│   ├── types.ts             # Interfaces métier + DTOs + unions
│   └── electron-api.ts      # Interface ElectronAPI (contrat IPC)
├── renderer/app/            # Application Angular (renderer process)
│   ├── src/app/
│   │   ├── services/        # Services Angular (DI, signaux)
│   │   ├── pages/           # Composants routés (jeu, historique, stats, joueurs)
│   │   └── composants/      # Composants enfants (plateau, tuile, clavier)
│   └── types/electron.d.ts  # Déclaration window.api
├── prisma/
│   ├── schema.prisma        # 9 modèles + 2 enums
│   └── seed.ts              # Données de démonstration
└── docs/
    └── schema-motus.drawio  # Schéma relationnel
```

---

## Flux de données

```
Composant Angular (page/enfant)
   → Service Angular (jeu/partie/joueur/defi/statistique.service)
      → ElectronService.getApi()         (garde sur window.api)
         → window.api  (Preload, contextBridge)
            → ipcRenderer.invoke('canal', ...args)
               → ipcMain.handle('canal', handler)    (src/main.ts, try/catch)
                  → fonction du Repository             (src/repository/*.ts)
                     → Prisma Client → SQLite (prisma/motus.db)
   ← le résultat typé remonte exactement en sens inverse
```

---

## Schéma relationnel

```
joueurs ─────────────────── 1:N ──── parties
  │                                    │
  │                               FK joueur_id (CASCADE)
  │                               FK mot_id (RESTRICT)
  │                               FK defi_quotidien_id (SET NULL)
  │                                    │
  └── N:M (joueur_succes) ─── succes   │
                                        │
mots ──── 1:N ──── defis_quotidiens ───┘
  │
  └── N:M (mot_theme) ──── themes
  │
  └── 1:N ──── essais (via parties)
```

Cardinalités Merise :
- Joueur (1,N) ──── (0,1) Partie : un joueur peut avoir plusieurs parties
- Mot (1,N) ──── (0,1) DefiQuotidien : un mot peut être défi plusieurs fois
- Partie (1,N) ──── (0,1) Essai : une partie a plusieurs essais
- Mot (N,M) ──── Theme : via table MotTheme
- Joueur (N,M) ──── Succes : via table JoueurSucces

---

## Choix de modélisation et équivalents SQL

### Relation 1:N (Joueur → Partie)
```sql
-- Prisma : joueur Joueur @relation(..., onDelete: Cascade)
ALTER TABLE parties ADD CONSTRAINT fk_joueur
  FOREIGN KEY (joueur_id) REFERENCES joueurs(id) ON DELETE CASCADE;
```

### Table de jonction N:M explicite (MotTheme)
```sql
-- Prisma : @@id([motId, themeId])
CREATE TABLE mot_theme (
  mot_id INTEGER NOT NULL,
  theme_id INTEGER NOT NULL,
  PRIMARY KEY (mot_id, theme_id),
  FOREIGN KEY (mot_id) REFERENCES mots(id) ON DELETE CASCADE,
  FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);
```

### include → JOIN
```sql
-- Prisma : partie.findMany({ include: { essais: true, mot: true } })
SELECT p.*, m.*, e.*
FROM parties p
JOIN mots m ON p.mot_id = m.id
LEFT JOIN essais e ON p.id = e.partie_id;
```

### count → COUNT(*)
```sql
-- Prisma : partie.count({ where: { joueurId, resultat: 'GAGNE' } })
SELECT COUNT(*) FROM parties WHERE joueur_id = ? AND resultat = 'GAGNE';
```

### groupBy → GROUP BY
```sql
-- Prisma : partie.groupBy({ by: ['nbEssais'], _count: { id: true } })
SELECT nb_essais, COUNT(id) FROM parties GROUP BY nb_essais;
```

### _avg → AVG()
```sql
-- Prisma : partie.aggregate({ _avg: { nbEssais: true } })
SELECT AVG(nb_essais) FROM parties WHERE resultat = 'GAGNE';
```

### $transaction → BEGIN/COMMIT
```sql
-- Prisma : prisma.$transaction(async (tx) => { ... })
BEGIN TRANSACTION;
  INSERT INTO essais (...) VALUES (...);
  UPDATE parties SET resultat = ? WHERE id = ?;
COMMIT; -- ou ROLLBACK si erreur
```

### onDelete : Cascade vs Restrict vs SetNull
| Comportement | Déclenché quand | Effet |
|---|---|---|
| `CASCADE` | Suppression d'un Joueur | Supprime toutes ses Parties et Essais |
| `RESTRICT` | Suppression d'un Mot utilisé dans une Partie | Erreur — interdit |
| `SET NULL` | Suppression d'un DefiQuotidien | Met defiQuotidienId à NULL dans les Parties |

---

## Note sur DATABASE_URL programmatique

Après compilation (`tsc`), `main.js` se trouve dans `dist/src/`. Pour trouver `prisma/motus.db` à la racine du projet, on remonte de 2 niveaux :

```typescript
process.env['DATABASE_URL'] = 'file:' + path.join(__dirname, '..', '..', 'prisma', 'motus.db');
```

Le fichier `.env` est utilisé uniquement par la CLI Prisma (migrate, studio, seed).

---

## Note sur withHashLocation()

Sous Electron, les pages sont chargées via le protocole `file://`. Sans la stratégie de hachage, Angular essaierait de naviguer vers `file:///chemin/statistiques`, qui serait interprété comme un chemin de fichier → erreur 404. Avec `withHashLocation()`, l'URL devient `file:///index.html#/statistiques` — Angular gère le fragment côté client.

```typescript
// app.config.ts
provideRouter(routes, withHashLocation())
```
