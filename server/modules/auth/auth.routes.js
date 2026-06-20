import { Router } from "express";
import { authRequired } from "../../middleware/auth.js";
import { authRateLimiter } from "../../middleware/rateLimiter.js";
import { registerRules, loginRules } from "../../validators/authValidators.js";
import * as ctrl from "./auth.controller.js";

const router = Router();

router.post("/register", authRateLimiter, ...registerRules, ctrl.register);
router.post("/login", authRateLimiter, ...loginRules, ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/verify-email", ctrl.verifyEmail);
router.post("/forgot-password", authRateLimiter, ctrl.forgotPassword);
router.post("/reset-password", authRateLimiter, ctrl.resetPassword);
router.get("/me", authRequired, ctrl.me);
router.post("/resend-verification", authRequired, ctrl.resendVerification);

export default router;
