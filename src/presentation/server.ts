import { CheckService } from "../domain/use-cases/checks/check-service.js";
import { SendEmailLogs } from "../domain/use-cases/email/send-logs.js";
import { FileSystemDataSource } from "../infrastructure/datasources/file-system.datasource.js";
import { logRepositoryImpl } from "../infrastructure/repositories/log.repository.js";
import { CronService } from "./cron/cron-service.js";
import { EmailService } from "./email/email.service.js";

const fileSystemLogRepository = new logRepositoryImpl(
  new FileSystemDataSource()
);

const emailService = new EmailService();

export class Server {
    static start() {
        console.log('Server started...');

        
        const sendEmailLogs = new SendEmailLogs(emailService, fileSystemLogRepository);
        sendEmailLogs.execute('paolofersantella@gmail.com');

        CronService.createJob('*/5 * * * * *', () => {
            const checkService = new CheckService(
              fileSystemLogRepository,
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