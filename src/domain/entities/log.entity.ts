export enum LogSeverityLevel {
    low = 'low',
    medium = 'medium',
    high = 'high',
}

interface MongoObj {
    message: string, 
    level: string, 
    origin: string, 
    createdAt: Date
}

export class LogEntity {
    
    public createdAt;

    constructor(
        public level: string,
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
    };

    static getEntityByObject = (object: MongoObj ): LogEntity => {
        const {createdAt, level, message, origin} = object;
        const log = new LogEntity(level, message, origin);
        log.createdAt = createdAt;

        return log;
    }

}