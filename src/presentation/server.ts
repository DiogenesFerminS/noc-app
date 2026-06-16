import type { CronJob } from "cron";
import { CheckServiceMultiple } from "../domain/use-cases/checks/check-service-multiple.js";
import { SendEmailLogs } from "../domain/use-cases/email/send-logs.js";
import { FileSystemDataSource } from "../infrastructure/datasources/file-system.datasource.js";
import { MongoLogDatasource } from "../infrastructure/datasources/mongo-log.datasource.js";
import { PostgresLogDatasource } from "../infrastructure/datasources/postgresql-log.datasource.js";
import { logRepositoryImpl } from "../infrastructure/repositories/log.repository.js";
import { getNocConfig, type NocDomainConfig } from "../config/noc-config.js";
import { CronService } from "./cron/cron-service.js";
import { EmailService } from "./email/email.service.js";

const CHECK_CRON = '*/5 * * * * *';    // cada 5 segundos
const DIGEST_CRON = '0 0 */12 * * *';  // cada 12 horas
const RELOAD_CRON = '0 */5 * * * *';   // cada 5 minutos

const fsLogRepository = new logRepositoryImpl(
  new FileSystemDataSource()
);

const mongoLogRepository = new logRepositoryImpl(
  new MongoLogDatasource()
);

const postgresLogRepository = new logRepositoryImpl(
  new PostgresLogDatasource()
)

const emailService = new EmailService();

export class Server {
    // Jobs de chequeo activos (uno por dominio); se reemplazan al recargar.
    private static checkJobs: CronJob[] = [];
    // Destinatarios actuales del resumen 12h; mutable para no recrear ese job.
    private static digestEmails: string[] = [];
    // Firma de la última config aplicada, para detectar cambios.
    private static configKey = '';

    static async start() {
        console.log('Server started...');

        // Config inicial desde Odoo.
        await Server.reloadConfig();

        // Resumen cada 12h: se crea una sola vez y lee los destinatarios vigentes
        // al momento de dispararse (así no hay que recrearlo en cada recarga).
        CronService.createJob(DIGEST_CRON, () => {
            if (Server.digestEmails.length === 0) return;
            const sendEmailLogs = new SendEmailLogs(emailService, fsLogRepository);
            sendEmailLogs.execute(Server.digestEmails);
        });

        // Recarga en caliente: cada 5 min relee Odoo y reprograma si cambió.
        CronService.createJob(RELOAD_CRON, () => {
            Server.reloadConfig();
        });
    }

    // Relee la config de Odoo y, solo si cambió, reprograma los chequeos.
    private static async reloadConfig() {
        const domains = await getNocConfig();

        // null = Odoo no respondió: conservamos la config actual.
        if (domains === null) {
            console.warn('No se pudo recargar la config; se mantiene la anterior.');
            return;
        }

        const key = Server.buildConfigKey(domains);
        if (key === Server.configKey) {
            return; // sin cambios, no se reprograma nada
        }

        Server.configKey = key;
        Server.digestEmails = [...new Set(domains.flatMap((domain) => domain.emails))];

        // Detiene los jobs de chequeo anteriores y crea los nuevos.
        Server.checkJobs.forEach((job) => job.stop());
        Server.checkJobs = domains.map((domain) => Server.createCheckJob(domain));

        console.log(`Configuración del NOC aplicada: ${domains.length} dominio(s) monitoreado(s).`);
    }

    private static createCheckJob(domain: NocDomainConfig): CronJob {
        let isServiceDown = false;

        return CronService.createJob(CHECK_CRON, () => {
            const checkService = new CheckServiceMultiple(
                [fsLogRepository, mongoLogRepository, postgresLogRepository],
                () => {
                    isServiceDown = false;
                },
                (error: string) => {
                    console.log(`SERVICE ${domain.url} IS NOT OK. ${error}`);

                    if (!isServiceDown && domain.emails.length > 0) {
                        isServiceDown = true;
                        console.log(`Servicio caído (${domain.name}): enviando alerta...`);
                        const sendEmailLogs = new SendEmailLogs(emailService, fsLogRepository);
                        sendEmailLogs
                            .sendHighLogEmail(domain.emails)
                            .then((sent) => console.log(`Alerta de log alto enviada para ${domain.url}:`, sent));
                    }
                }
            );
            checkService.execute(domain.url);
        });
    }

    private static buildConfigKey(domains: NocDomainConfig[]): string {
        const normalized = domains
            .map((domain) => ({ url: domain.url, emails: [...domain.emails].sort() }))
            .sort((a, b) => a.url.localeCompare(b.url));
        return JSON.stringify(normalized);
    }
}
