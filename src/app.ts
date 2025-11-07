import { envs } from "./config/plugins/envs.plugin.js";
import { Server } from "./presentation/server.js";

const main = async () => {
    Server.start();
    // console.log(envs)
}

(async () => {
    main()
})();

