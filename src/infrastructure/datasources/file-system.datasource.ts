import * as fs from 'fs';

import type { LogDataSource } from "../../domain/datasources/log.datasource.js";
import { LogEntity, LogSeverityLevel } from "../../domain/entities/log.entity.js";

export class FileSystemDataSource implements LogDataSource {

    private readonly logPath = 'logs/';
    private readonly allLogsPath = 'logs/logs-all.log';
    private readonly mediumLogsPath = 'logs/logs-medium.log';
    private readonly highLogsPath = 'logs/logs-high.log';

    constructor() {
        this.createLogsFiles();
    }

    private createLogsFiles = async () => {
        if(!fs.existsSync(this.logPath)) {
            fs.mkdirSync(this.logPath);
        };

        [
            this.allLogsPath,
            this.mediumLogsPath,
            this.highLogsPath,
        ].forEach( path => {
            if(fs.existsSync(path)) return;

            fs.writeFileSync(path, '');
        })
        
    }


    async saveLog(newLog: LogEntity): Promise<void> {

        const logJson = `${JSON.stringify(newLog)}\n`;

        fs.appendFileSync(this.allLogsPath, logJson);

        if(newLog.level === LogSeverityLevel.low) return;

        if(newLog.level === LogSeverityLevel.medium){
            fs.appendFileSync(this.mediumLogsPath, logJson);
            return;
        }

         if(newLog.level === LogSeverityLevel.high){
            fs.appendFileSync(this.highLogsPath, logJson);
            return;
         }
    }

    private getJsonFromFile = async (path:string): Promise<LogEntity[]> => {
        const content = fs.readFileSync(path, 'utf-8');

        if(content === '') return [];

        const logs = content.trim().split('\n').map((log) => LogEntity.getEntityByJson(log));

        return logs;
    }

    async getLogs(severityLevel: LogSeverityLevel): Promise<LogEntity[]> {
        switch( severityLevel ){
            case LogSeverityLevel.low:
                return this.getJsonFromFile(this.allLogsPath);

            case LogSeverityLevel.medium:
                return this.getJsonFromFile(this.mediumLogsPath);

            case LogSeverityLevel.high:
                return this.getJsonFromFile(this.highLogsPath);
                
            default:
                throw new Error(`${severityLevel} not implemented`)
        }
    }

}