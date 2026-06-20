import { Router } from "express";
import { authRequired } from "../../middleware/auth.js";
import * as ctrl from "./notifications.controller.js";

const router = Router();
router.use(authRequired);

router.get("/", ctrl.listNotifications);
router.get("/unread-count", ctrl.unreadCount);
router.patch("/read-all", ctrl.markAllRead);
router.patch("/:id/read", ctrl.markRead);

export default router;
