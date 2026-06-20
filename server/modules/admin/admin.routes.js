import { Router } from "express";
import { body } from "express-validator";
import { authRequired, requireAdmin } from "../../middleware/auth.js";
import * as ctrl from "./admin.controller.js";

const router = Router();
router.use(authRequired, requireAdmin);

router.get("/users", ctrl.listUsers);
router.patch("/users/:id", [body("role").optional().isIn(["user", "admin"])], ctrl.updateUser);
router.delete("/users/:id", ctrl.deleteUser);

router.get("/items", ctrl.listAllItems);
router.delete("/items/:id", ctrl.adminDeleteItem);
router.patch("/items/:id/flag", ctrl.flagItem);

router.get("/analytics/overview", ctrl.analyticsOverview);
router.get("/analytics/categories", ctrl.analyticsCategories);
router.get("/analytics/locations", ctrl.analyticsLocations);
router.get("/analytics/matches", ctrl.analyticsMatches);
router.get("/analytics/export", ctrl.exportReport);

export default router;
