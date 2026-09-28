-- Reconcile the initial migration with the current Decision model.
-- Existing titles longer than 200 characters must be corrected before applying.
ALTER TABLE "Decision" ALTER COLUMN "title" TYPE VARCHAR(200);

CREATE INDEX "Decision_userId_status_idx" ON "Decision"("userId", "status");
CREATE INDEX "Decision_userId_createdAt_idx" ON "Decision"("userId", "createdAt");
CREATE INDEX "Decision_userId_decidedAt_idx" ON "Decision"("userId", "decidedAt");

-- Impact uses a signed -10..10 scale with two decimal places.
ALTER TABLE "Expectation" ALTER COLUMN "expectedImpact" TYPE DECIMAL(4,2)
  USING "expectedImpact"::DECIMAL(4,2);
ALTER TABLE "Outcome" ALTER COLUMN "impact" TYPE DECIMAL(4,2)
  USING "impact"::DECIMAL(4,2);

ALTER TABLE "Expectation" ADD CONSTRAINT "Expectation_expectedImpact_range_check"
  CHECK ("expectedImpact" IS NULL OR "expectedImpact" BETWEEN -10 AND 10);
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_impact_range_check"
  CHECK ("impact" IS NULL OR "impact" BETWEEN -10 AND 10);
ALTER TABLE "Checkpoint" ADD CONSTRAINT "Checkpoint_score_range_check"
  CHECK ("score" IS NULL OR "score" BETWEEN 0 AND 10);
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_satisfactionScore_range_check"
  CHECK ("satisfactionScore" IS NULL OR "satisfactionScore" BETWEEN 0 AND 10);
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_regretScore_range_check"
  CHECK ("regretScore" IS NULL OR "regretScore" BETWEEN 0 AND 10);

-- Required text must contain at least one non-whitespace character.
ALTER TABLE "Decision" ADD CONSTRAINT "Decision_title_nonblank_check"
  CHECK (length(btrim("title")) > 0);
ALTER TABLE "Expectation" ADD CONSTRAINT "Expectation_description_nonblank_check"
  CHECK (length(btrim("description")) > 0);
ALTER TABLE "Outcome" ADD CONSTRAINT "Outcome_description_nonblank_check"
  CHECK (length(btrim("description")) > 0);
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_name_nonblank_check"
  CHECK (length(btrim("name")) > 0);
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_content_nonblank_check"
  CHECK (length(btrim("content")) > 0);

-- Composite keys let the assessment reference both sides of the same decision.
CREATE UNIQUE INDEX "Expectation_id_decisionId_key" ON "Expectation"("id", "decisionId");
CREATE INDEX "Expectation_decisionId_idx" ON "Expectation"("decisionId");
CREATE UNIQUE INDEX "Outcome_id_decisionId_key" ON "Outcome"("id", "decisionId");
CREATE INDEX "Outcome_decisionId_idx" ON "Outcome"("decisionId");

CREATE TABLE "MetricMeasurement" (
    "id" UUID NOT NULL,
    "metricId" UUID NOT NULL,
    "value" DECIMAL(18,4) NOT NULL,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MetricMeasurement_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MetricMeasurement_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "Metric"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MetricMeasurement_metricId_recordedAt_id_idx"
  ON "MetricMeasurement"("metricId", "recordedAt", "id");

CREATE TYPE "ExpectationAssessmentResult" AS ENUM ('MET', 'PARTIALLY_MET', 'NOT_MET', 'INCONCLUSIVE');
CREATE TABLE "ExpectationAssessment" (
    "id" UUID NOT NULL,
    "decisionId" UUID NOT NULL,
    "expectationId" UUID NOT NULL,
    "outcomeId" UUID NOT NULL,
    "result" "ExpectationAssessmentResult" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "ExpectationAssessment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ExpectationAssessment_expectationId_decisionId_fkey"
      FOREIGN KEY ("expectationId", "decisionId") REFERENCES "Expectation"("id", "decisionId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExpectationAssessment_outcomeId_decisionId_fkey"
      FOREIGN KEY ("outcomeId", "decisionId") REFERENCES "Outcome"("id", "decisionId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "ExpectationAssessment_expectationId_outcomeId_key"
  ON "ExpectationAssessment"("expectationId", "outcomeId");
CREATE INDEX "ExpectationAssessment_outcomeId_decisionId_idx"
  ON "ExpectationAssessment"("outcomeId", "decisionId");
