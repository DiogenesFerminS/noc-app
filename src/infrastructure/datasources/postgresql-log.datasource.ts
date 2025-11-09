import type { LogDataSource } from "../../domain/datasources/log.datasource.js";
import { LogEntity, type LogSeverityLevel } from "../../domain/entities/log.entity.js";
import { PrismaClient, SeverityLevel } from "../../generated/prisma/index.js";

const prisma = new PrismaClient;

const severityLevelEnum = {
    high: SeverityLevel.HIGH,
    medium: SeverityLevel.MEDIUM,
    low: SeverityLevel.LOW,
};

export class PostgresLogDatasource implements LogDataSource {

    async saveLog(log: LogEntity): Promise<void> {

        const level = severityLevelEnum[log.level as 'high' | 'low' | 'medium']

        const newLog = await prisma.logModel.create({
            data: {
                ...log,
                level
            }
        })

        console.log(`Log created with id: ${newLog.id}` );
    }

    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        const level = severityLevelEnum[severityLevel]
        const dbLogs = await prisma.logModel.findMany({
            where: {
                level
            }
        });

        return dbLogs.map((log) => LogEntity.getEntityByObject(log));
    }

}