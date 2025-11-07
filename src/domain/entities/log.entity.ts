export enum LogSeverityLevel {
    low = 'low',
    medium = 'medium',
    high = 'high',
}

export class LogEntity {
    
    public createdAt;

    constructor(
        public level: LogSeverityLevel,
        public message: string,
    ) {
        this.createdAt = new Date();
    }

    static getEntityByJson = (json: string): LogEntity => {
        const {message, level, createdAt} = JSON.parse(json);

        const log = new LogEntity(level, message);
        log.createdAt = createdAt;

        return log;
    }

}