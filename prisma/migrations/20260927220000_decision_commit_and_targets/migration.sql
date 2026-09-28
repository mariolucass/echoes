BEGIN;

-- Introduce an explicit draft state without reinterpreting existing ACTIVE rows.
CREATE TYPE "DecisionStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ABANDONED', 'ARCHIVED');
ALTER TABLE "Decision" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Decision" ALTER COLUMN "status" TYPE "DecisionStatus_new"
  USING "status"::text::"DecisionStatus_new";
DROP TYPE "DecisionStatus";
ALTER TYPE "DecisionStatus_new" RENAME TO "DecisionStatus";
ALTER TABLE "Decision" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

CREATE TABLE "DecisionAlternative" (
  "id" UUID NOT NULL,
  "decisionId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT,
  "pros" TEXT,
  "cons" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionAlternative_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DecisionAlternative_title_nonblank_check" CHECK (length(btrim("title")) > 0),
  CONSTRAINT "DecisionAlternative_decisionId_fkey"
    FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DecisionAlternative_id_decisionId_key"
  ON "DecisionAlternative"("id", "decisionId");
CREATE INDEX "DecisionAlternative_decisionId_idx" ON "DecisionAlternative"("decisionId");

ALTER TABLE "Decision" ADD COLUMN "rationale" TEXT;
ALTER TABLE "Decision" ADD COLUMN "chosenAlternativeId" UUID;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_chosenAlternativeId_id_fkey"
  FOREIGN KEY ("chosenAlternativeId", "id")
  REFERENCES "DecisionAlternative"("id", "decisionId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_draft_state_check"
  CHECK ("status" <> 'DRAFT' OR ("decidedAt" IS NULL AND "chosenAlternativeId" IS NULL));

CREATE TABLE "DecisionRevision" (
  "id" UUID NOT NULL,
  "decisionId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DecisionRevision_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DecisionRevision_version_positive_check" CHECK ("version" > 0),
  CONSTRAINT "DecisionRevision_snapshot_object_check" CHECK (jsonb_typeof("snapshot") = 'object'),
  CONSTRAINT "DecisionRevision_decisionId_fkey"
    FOREIGN KEY ("decisionId") REFERENCES "Decision"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DecisionRevision_decisionId_version_key"
  ON "DecisionRevision"("decisionId", "version");

CREATE FUNCTION prevent_decision_revision_change() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Decision revisions are immutable';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "DecisionRevision_immutable_trigger"
  BEFORE UPDATE OR DELETE ON "DecisionRevision"
  FOR EACH ROW EXECUTE FUNCTION prevent_decision_revision_change();

CREATE TYPE "TargetOperator" AS ENUM ('GTE', 'LTE', 'EQ');
CREATE UNIQUE INDEX "Metric_id_decisionId_key" ON "Metric"("id", "decisionId");
CREATE TABLE "ExpectationTarget" (
  "id" UUID NOT NULL,
  "decisionId" UUID NOT NULL,
  "expectationId" UUID NOT NULL,
  "metricId" UUID NOT NULL,
  "operator" "TargetOperator" NOT NULL,
  "targetValue" DECIMAL(18,4) NOT NULL,
  "baselineValue" DECIMAL(18,4),
  "evaluateAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExpectationTarget_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ExpectationTarget_expectationId_decisionId_fkey"
    FOREIGN KEY ("expectationId", "decisionId") REFERENCES "Expectation"("id", "decisionId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ExpectationTarget_metricId_decisionId_fkey"
    FOREIGN KEY ("metricId", "decisionId") REFERENCES "Metric"("id", "decisionId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExpectationTarget_expectationId_metricId_key"
  ON "ExpectationTarget"("expectationId", "metricId");
CREATE INDEX "ExpectationTarget_metricId_decisionId_idx"
  ON "ExpectationTarget"("metricId", "decisionId");

COMMIT;
