// ─── Instance unique PrismaClient ─────────────────────────────────────────
// Notion vue en cours : Singleton — une seule connexion à la base SQLite
// Équivalent SQL : une seule connexion JDBC/SQLite ouverte pendant toute la durée de vie

import { PrismaClient } from '@prisma/client';

// Instance partagée par tous les repositories
const prismaClient = new PrismaClient({
  log: ['warn', 'error'],
});

// Ferme proprement la connexion à la base lors de l'arrêt de l'application
// Appelée dans main.ts sur l'événement 'before-quit'
export async function closeDb(): Promise<void> {
  await prismaClient.$disconnect();
}

export default prismaClient;
