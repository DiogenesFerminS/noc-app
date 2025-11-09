import { envs } from "./config/plugins/envs.plugin.js";
import {MongoDataBase} from "./data/mongo/init.js"
import { Server } from "./presentation/server.js";

const main = async () => {
    Server.start();

    const {MONGO_URL, MONGO_DB_NAME} = envs;

    await MongoDataBase.connect({mongoUrl: MONGO_URL, dbName: MONGO_DB_NAME});
}

(async () => {
    main()
})();

