import { LogSeverityLevel } from "../domain/entities/log.entity.js";
import { CheckServiceMultiple } from "../domain/use-cases/checks/check-service-multiple.js";
import { CheckService } from "../domain/use-cases/checks/check-service.js";
import { SendEmailLogs } from "../domain/use-cases/email/send-logs.js";
import { FileSystemDataSource } from "../infrastructure/datasources/file-system.datasource.js";
import { MongoLogDatasource } from "../infrastructure/datasources/mongo-log.datasource.js";
import { PostgresLogDatasource } from "../infrastructure/datasources/postgresql-log.datasource.js";
import { logRepositoryImpl } from "../infrastructure/repositories/log.repository.js";
import { CronService } from "./cron/cron-service.js";
import { EmailService } from "./email/email.service.js";

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
    static async start() {
        console.log('Server started...');
        
        
        
        CronService.createJob('0 0 */12 * * *', () => {
          const sendEmailLogs = new SendEmailLogs(emailService, fsLogRepository);
          sendEmailLogs.execute('paolofersantella@gmail.com');
        })

        CronService.createJob('*/5 * * * * *', () => {
            const checkService = new CheckServiceMultiple(
              [fsLogRepository, mongoLogRepository, postgresLogRepository],
              () => {
                console.log("SERVICE IS WORKING");
              },
              (error: string) => {
                console.log(`SERVICE IS NOT OK. ${error}`);
              }
            );
            checkService.execute('https://youtube.com');
            // checkService.execute('http://localhost:3000/posts');
        })
    }
}