-- CreateTable
CREATE TABLE "joueurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pseudo" TEXT NOT NULL,
    "cree_le" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "mots" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "valeur" TEXT NOT NULL,
    "longueur" INTEGER NOT NULL,
    "difficulte" TEXT NOT NULL,
    "definition" TEXT
);

-- CreateTable
CREATE TABLE "themes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL DEFAULT '#cccccc'
);

-- CreateTable
CREATE TABLE "mot_theme" (
    "motId" INTEGER NOT NULL,
    "themeId" INTEGER NOT NULL,

    PRIMARY KEY ("motId", "themeId"),
    CONSTRAINT "mot_theme_motId_fkey" FOREIGN KEY ("motId") REFERENCES "mots" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "mot_theme_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "themes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "defis_quotidiens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "mot_id" INTEGER NOT NULL,
    CONSTRAINT "defis_quotidiens_mot_id_fkey" FOREIGN KEY ("mot_id") REFERENCES "mots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parties" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "joueur_id" INTEGER NOT NULL,
    "mot_id" INTEGER NOT NULL,
    "defi_quotidien_id" INTEGER,
    "difficulte" TEXT NOT NULL,
    "resultat" TEXT NOT NULL DEFAULT 'EN_COURS',
    "nb_essais" INTEGER NOT NULL DEFAULT 0,
    "commencee_le" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "terminee_le" DATETIME,
    CONSTRAINT "parties_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "joueurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "parties_mot_id_fkey" FOREIGN KEY ("mot_id") REFERENCES "mots" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "parties_defi_quotidien_id_fkey" FOREIGN KEY ("defi_quotidien_id") REFERENCES "defis_quotidiens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "essais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "partie_id" INTEGER NOT NULL,
    "contenu" TEXT NOT NULL,
    "index_ligne" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "cree_le" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "essais_partie_id_fkey" FOREIGN KEY ("partie_id") REFERENCES "parties" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "succes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "joueur_succes" (
    "joueur_id" INTEGER NOT NULL,
    "succes_id" INTEGER NOT NULL,
    "debloque_le" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("joueur_id", "succes_id"),
    CONSTRAINT "joueur_succes_joueur_id_fkey" FOREIGN KEY ("joueur_id") REFERENCES "joueurs" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "joueur_succes_succes_id_fkey" FOREIGN KEY ("succes_id") REFERENCES "succes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "joueurs_pseudo_key" ON "joueurs"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "mots_valeur_key" ON "mots"("valeur");

-- CreateIndex
CREATE UNIQUE INDEX "themes_nom_key" ON "themes"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "defis_quotidiens_date_key" ON "defis_quotidiens"("date");

-- CreateIndex
CREATE UNIQUE INDEX "succes_code_key" ON "succes"("code");
