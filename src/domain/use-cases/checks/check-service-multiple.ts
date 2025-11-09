import { LogEntity, LogSeverityLevel } from "../../entities/log.entity.js";
import type { LogRepository } from "../../repository/log.repository.js";

interface CheckServiceMultipleUseCase {
    execute(url: string): Promise<boolean>;
}

type SuccessCallback = (() => void) | undefined;
type ErrorCallback = ((error: string) => void) | undefined;

const origin = 'check-service.ts';

export class CheckServiceMultiple implements CheckServiceMultipleUseCase {

    constructor(
        private readonly logRepository: LogRepository[],
        private readonly successCallback: SuccessCallback,
        private readonly errorCallback: ErrorCallback,
    ) {}

    private callLogs( log: LogEntity ) {
        this.logRepository.forEach((repository) => {
            repository.saveLog(log);
        });
    }

    async execute(url: string): Promise<boolean> {
        try {
            const req = await fetch(url);

            if(!req.ok) {
                throw new Error(`Error on check service ${url}`)
            }

            const log = new LogEntity(LogSeverityLevel.low, `SERVICE ${url} IS WORKING`, origin);
            this.callLogs(log);

            this.successCallback && this.successCallback();
            return true;

        } catch (error) {
            if (error instanceof Error) {

                const log = new LogEntity(LogSeverityLevel.high, `SERVICE ${url} IS NOT OK. ${error.message}`, origin );

                this.callLogs(log);

                this.errorCallback && this.errorCallback(error.message);
                return false;   
            }
            
            const log = new LogEntity(LogSeverityLevel.high, `SERVICE ${url} IS NOT OK. UNKNOW ERROR`, origin);
            this.callLogs(log);

            this.errorCallback && this.errorCallback('Unknow error');
            return false;
        }
    }
}