import { logger } from "../config/logger.js";
import type { DecisionEventSubscriber } from "../events/index.js";

export const logDecisionActivity: DecisionEventSubscriber = (event) => {
  if (event.type === "decision.committed.v1") {
    logger.info(
      {
        eventType: event.type,
        decisionId: event.decisionId,
        userId: event.userId,
        revisionId: event.revisionId,
        occurredAt: event.occurredAt,
      },
      "Decision committed",
    );
    return;
  }

  logger.info(
    {
      eventType: event.type,
      decisionId: event.decisionId,
      userId: event.userId,
      outcomeId: event.outcomeId,
      status: event.status,
      occurredAt: event.occurredAt,
    },
    "Decision reviewed",
  );
};
