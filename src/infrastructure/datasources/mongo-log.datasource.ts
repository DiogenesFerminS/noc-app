import { LogModel } from "../../data/mongo/models/log.model.js";
import type { LogDataSource } from "../../domain/datasources/log.datasource.js";
import { LogEntity, type LogSeverityLevel } from "../../domain/entities/log.entity.js";

export class MongoLogDatasource implements LogDataSource {

    async saveLog(log: LogEntity): Promise<void> {
        const newLog = await LogModel.create(log);
        await newLog.save();
        console.log('Mongo log created:', newLog.id);
    }
    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        const mongoLogs = await LogModel.find({
            level: severityLevel,
        });

        const logs = mongoLogs.map((log) => {
            return LogEntity.getEntityByObject({
                createdAt: log.createdAt,
                message: log.message,
                level: log.level as LogSeverityLevel,
                origin: log.origin as string
            });
        });

        return logs;
    }

}