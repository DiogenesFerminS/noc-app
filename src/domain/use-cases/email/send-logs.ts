import type { EmailService } from "../../../presentation/email/email.service.js";
import { LogEntity, LogSeverityLevel } from "../../entities/log.entity.js";
import type { LogRepository } from "../../repository/log.repository.js";

interface SendLogEmailUseCase {
    execute: (to: string | string[]) => Promise<boolean>
    sendHighLogEmail: (to: string | string[]) => Promise<boolean>
};

export class SendEmailLogs implements SendLogEmailUseCase {

    constructor(
        private readonly emailService: EmailService,
        private readonly logRepository: LogRepository,
    ) {}

    // Email programado (cada 12h): adjunta todos los logs y limpia el file system.
    async execute(to: string | string[]) {

        try {
            const sent = await this.emailService.sendEmailWithFileSystemLogs(to);

            if (!sent) {
                throw new Error('Email log not sent');
            }

            // Se limpian los logs del file system tras enviarlos para no acumular.
            await this.logRepository.clearLogs();

            const log = new LogEntity(LogSeverityLevel.low, `EMAIL SENT TO ${to} ON ${Date.now()}`, 'send-logs.ts')
            this.logRepository.saveLog(log);
            return true;
        } catch (error) {
            const log = new LogEntity(LogSeverityLevel.high, `EMAIL FAILED TO SEND ${to} ON ${Date.now()}`, 'send-logs.ts')
            this.logRepository.saveLog(log);
            return false;
        }
    }

    // Email inmediato cuando aparece un log de severidad alta (alerta en tiempo real).
    async sendHighLogEmail(to: string | string[]) {
        const highLogs = await this.logRepository.getLogs(LogSeverityLevel.high);

        if (highLogs.length === 0) {
            return false;
        }

        return this.emailService.sendEmailWithFileSystemLogs(to, true);
    }

}