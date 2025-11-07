import { CheckService } from "../domain/use-cases/checks/check-service.js";
import { FileSystemDataSource } from "../infrastructure/datasources/file-system.datasource.js";
import { logRepositoryImpl } from "../infrastructure/repositories/log.repository.js";
import { CronService } from "./cron/cron-service.js";

const fileSystemLogRepository = new logRepositoryImpl(
  new FileSystemDataSource()
);

export class Server {
    static start() {
        console.log('Server started...');

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