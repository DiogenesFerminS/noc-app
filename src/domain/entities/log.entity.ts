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
        public origin : string,
    ) {
        this.createdAt = new Date();
    }

    static getEntityByJson = (json: string): LogEntity => {
        const {message, level, createdAt, origin} = JSON.parse(json);

        const log = new LogEntity(level, message, origin);
        log.createdAt = createdAt;

        return log;
    }

}