import pinoHttp from "pino-http";
import { getLogger } from "../utils/logger.js";

export const requestLogger = pinoHttp({
  logger: getLogger(),
  genReqId: (req) => req.requestId,
  customProps: (req) => ({ requestId: req.requestId }),
  autoLogging: {
    ignore: (req) => req.url === "/api/health/live" || req.url === "/api/health/ready",
  },
});
