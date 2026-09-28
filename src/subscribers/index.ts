import { decisionEvents } from "../events/index.js";
import { logDecisionActivity } from "./decision-activity.subscriber.js";

export function registerDecisionSubscribers(): () => void {
  return decisionEvents.subscribe(logDecisionActivity);
}
