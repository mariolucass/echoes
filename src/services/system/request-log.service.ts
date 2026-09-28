import {
  RequestLogRepository,
  type RequestLog,
} from "../../repositories/system/index.js";

export class RequestLogService {
  constructor(private readonly repository = new RequestLogRepository()) {}

  record(log: RequestLog): Promise<void> {
    return this.repository.create(log);
  }

  async listByDate(date: string): Promise<RequestLog[]> {
    return this.repository.findByDate(date);
  }
}
