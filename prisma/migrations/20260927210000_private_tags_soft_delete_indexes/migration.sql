BEGIN;

-- An unused global tag has no owner to infer. Stop rather than discard it.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Tag" t
    WHERE NOT EXISTS (SELECT 1 FROM "_DecisionTags" dt WHERE dt."B" = t."id")
  ) THEN
    RAISE EXCEPTION 'Unassigned global tags must be assigned to a decision or removed before this migration';
  END IF;
END $$;

-- Existing mixed-case addresses must not collapse to the same normalized key.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "User"
    GROUP BY lower(btrim("email"))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate user emails after normalization must be resolved before this migration';
  END IF;
END $$;
UPDATE "User" SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));
ALTER TABLE "User" ADD CONSTRAINT "User_email_normalized_check"
  CHECK ("email" = lower(btrim("email")) AND length("email") BETWEEN 1 AND 254);

ALTER TABLE "Decision" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "Decision" DROP CONSTRAINT "Decision_userId_fkey";
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Decision_id_userId_key" ON "Decision"("id", "userId");

DROP INDEX "Decision_userId_status_idx";
DROP INDEX "Decision_userId_createdAt_idx";
DROP INDEX "Decision_userId_decidedAt_idx";
CREATE INDEX "Decision_userId_deletedAt_createdAt_id_idx"
  ON "Decision"("userId", "deletedAt", "createdAt", "id");
CREATE INDEX "Decision_userId_deletedAt_status_createdAt_id_idx"
  ON "Decision"("userId", "deletedAt", "status", "createdAt", "id");
CREATE INDEX "Decision_userId_deletedAt_decidedAt_id_idx"
  ON "Decision"("userId", "deletedAt", "decidedAt", "id");

-- Duplicate shared tags per owner; preserve the old ID for the first owner.
DROP INDEX "Tag_name_key";
ALTER TABLE "Tag" ADD COLUMN "userId" UUID;
CREATE TABLE "_TagOwnershipMigration" (
  "tagId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "newTagId" UUID NOT NULL,
  PRIMARY KEY ("tagId", "userId")
);
INSERT INTO "_TagOwnershipMigration" ("tagId", "userId", "newTagId")
SELECT "tagId", "userId",
  CASE WHEN row_number() OVER (PARTITION BY "tagId" ORDER BY "userId") = 1
    THEN "tagId" ELSE gen_random_uuid() END
FROM (
  SELECT DISTINCT t."id" AS "tagId", d."userId"
  FROM "Tag" t
  JOIN "_DecisionTags" dt ON dt."B" = t."id"
  JOIN "Decision" d ON d."id" = dt."A"
) owners;

UPDATE "Tag" t SET "userId" = m."userId"
FROM "_TagOwnershipMigration" m
WHERE t."id" = m."tagId" AND m."newTagId" = m."tagId";

INSERT INTO "Tag" ("id", "name", "createdAt", "updatedAt", "userId")
SELECT m."newTagId", t."name", t."createdAt", t."updatedAt", m."userId"
FROM "_TagOwnershipMigration" m
JOIN "Tag" t ON t."id" = m."tagId"
WHERE m."newTagId" <> m."tagId";

ALTER TABLE "Tag" ALTER COLUMN "userId" SET NOT NULL;
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");
CREATE UNIQUE INDEX "Tag_id_userId_key" ON "Tag"("id", "userId");
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Explicit join and composite foreign keys enforce shared ownership.
CREATE TABLE "DecisionTag" (
  "decisionId" UUID NOT NULL,
  "tagId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionTag_pkey" PRIMARY KEY ("decisionId", "tagId"),
  CONSTRAINT "DecisionTag_decisionId_userId_fkey"
    FOREIGN KEY ("decisionId", "userId") REFERENCES "Decision"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DecisionTag_tagId_userId_fkey"
    FOREIGN KEY ("tagId", "userId") REFERENCES "Tag"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DecisionTag_tagId_userId_idx" ON "DecisionTag"("tagId", "userId");
INSERT INTO "DecisionTag" ("decisionId", "tagId", "userId")
SELECT dt."A", m."newTagId", d."userId"
FROM "_DecisionTags" dt
JOIN "Decision" d ON d."id" = dt."A"
JOIN "_TagOwnershipMigration" m ON m."tagId" = dt."B" AND m."userId" = d."userId";

DROP TABLE "_DecisionTags";
DROP TABLE "_TagOwnershipMigration";

COMMIT;
