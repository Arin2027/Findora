import { Router } from "express";
import { authRequired } from "../../middleware/auth.js";
import * as ctrl from "./matches.controller.js";

const router = Router();
router.use(authRequired);

router.get("/", ctrl.listMyMatches);
router.get("/:id", ctrl.getMatch);
router.post("/:id/claim", ctrl.requestClaim);
router.patch("/:id/claim/review", ctrl.reviewClaim);
router.patch("/:id/dismiss", ctrl.dismissMatch);

export default router;
