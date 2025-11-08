import { Server } from "./presentation/server.js";

const main = async () => {
    Server.start();
}

(async () => {
    main()
})();

