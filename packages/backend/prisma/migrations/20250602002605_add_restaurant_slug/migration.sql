/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `restaurantes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `restaurantes` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add slug column as nullable first
ALTER TABLE "restaurantes" ADD COLUMN "slug" TEXT;

-- Step 2: Update existing restaurants with generated slugs
UPDATE "restaurantes" SET "slug" = CASE 
  WHEN id = (SELECT id FROM "restaurantes" WHERE nombre = 'Test Restaurant' LIMIT 1) THEN 'test-restaurant'
  WHEN nombre ILIKE '%admin%' THEN LOWER(REGEXP_REPLACE(nombre, '[^A-Za-z0-9]+', '-', 'g'))
  ELSE LOWER(REGEXP_REPLACE(TRIM(nombre), '[^A-Za-z0-9\s]+', '', 'g')) || '-' || SUBSTRING(id, 1, 8)
END
WHERE "slug" IS NULL;

-- Step 3: Ensure all slugs are unique by appending numbers if needed
WITH numbered_restaurants AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY "createdAt") as rn
  FROM "restaurantes"
)
UPDATE "restaurantes" 
SET "slug" = nr.slug || CASE WHEN nr.rn > 1 THEN '-' || nr.rn ELSE '' END
FROM numbered_restaurants nr
WHERE "restaurantes".id = nr.id AND nr.rn > 1;

-- Step 4: Make slug column NOT NULL
ALTER TABLE "restaurantes" ALTER COLUMN "slug" SET NOT NULL;

-- Step 5: Create unique index
CREATE UNIQUE INDEX "restaurantes_slug_key" ON "restaurantes"("slug");
