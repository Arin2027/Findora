import { Router } from "express";
import { body } from "express-validator";
import { authRequired } from "../../middleware/auth.js";
import * as ctrl from "./chat.controller.js";

const router = Router();
router.use(authRequired);

router.get("/", ctrl.listConversations);
router.post("/", [body("matchId").isMongoId()], ctrl.createConversation);
router.get("/:id/messages", ctrl.listMessages);
router.post("/:id/messages", [body("body").optional().isString().isLength({ max: 5000 })], ctrl.sendMessage);
router.patch("/:id/read", ctrl.markMessagesRead);

export default router;
