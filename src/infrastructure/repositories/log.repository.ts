import type { LogDataSource } from "../../domain/datasources/log.datasource.js";
import type { LogEntity, LogSeverityLevel } from "../../domain/entities/log.entity.js";
import type { LogRepository } from "../../domain/repository/log.repository.js";

export class logRepositoryImpl implements LogRepository {

    constructor(
        private readonly logDatasource: LogDataSource
    ) {}

    saveLog(log: LogEntity): Promise<void> {
        return this.logDatasource.saveLog(log);
    }
    getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        return this.logDatasource.getLogs(severityLevel);
    }

}