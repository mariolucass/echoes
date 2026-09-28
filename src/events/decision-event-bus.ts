import { logger } from "../config/logger.js";
import type { DecisionEvent, DecisionEventPublisher, DecisionEventSubscriber } from "./decision.events.js";

/** In-process delivery for non-critical side effects only. */
export class DecisionEventBus implements DecisionEventPublisher {
  private readonly subscribers = new Set<DecisionEventSubscriber>();

  subscribe(subscriber: DecisionEventSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  async publish(event: DecisionEvent): Promise<void> {
    const results = await Promise.allSettled(
      [...this.subscribers].map((subscriber) => Promise.resolve().then(() => subscriber(event))),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        logger.error(
          { err: result.reason, eventType: event.type, decisionId: event.decisionId },
          "Decision event subscriber failed",
        );
      }
    }
  }
}

export const decisionEvents = new DecisionEventBus();
