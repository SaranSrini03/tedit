import { createServer } from "http";
import { initializeWebSocketServer } from "./websocket-server";

const port = Number(process.env.PORT) || 3001;
const hostname = process.env.HOSTNAME || "0.0.0.0";

const httpServer = createServer();

initializeWebSocketServer(httpServer);

httpServer
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, hostname, () => {
    console.log(`WebSocket server ready on ws://${hostname}:${port}`);
  });

