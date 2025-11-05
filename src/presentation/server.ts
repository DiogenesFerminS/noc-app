import { CheckService } from "../domain/use-cases/checks/check-service";
import { CronService } from "./cron/cron-service";

export class Server {
    static start() {
        console.log('Server started...');

        CronService.createJob('*/5 * * * * *', () => {
            const checkService = new CheckService(
              () => {
                console.log("Succes");
              },
              (error: string) => {
                console.log(error);
              }
            );
            checkService.execute('https://google.com');
            // checkService.execute('http://localhost:3000/posts');
        })
    }
}