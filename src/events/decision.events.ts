export type DecisionEvent =
  | {
      type: "decision.committed.v1";
      decisionId: string;
      userId: string;
      occurredAt: string;
      revisionId: string;
    }
  | {
      type: "decision.reviewed.v1";
      decisionId: string;
      userId: string;
      occurredAt: string;
      outcomeId: string;
      status: "ACTIVE" | "COMPLETED";
    };

export interface DecisionEventPublisher {
  publish(event: DecisionEvent): Promise<void>;
}

export type DecisionEventSubscriber = (event: DecisionEvent) => void | Promise<void>;
