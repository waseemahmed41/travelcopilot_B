import { Router } from "express";
import authController, { googleLoginSchema, signupSchema, loginSchema } from "../controllers/auth.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/limit.middleware";

const router = Router();

router.post(
  "/signup",
  authLimiter,
  validateRequest(signupSchema),
  authController.signup
);

router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  authController.login
);

router.post(
  "/google",
  authLimiter,
  validateRequest(googleLoginSchema),
  authController.googleLogin
);

router.get(
  "/me",
  authenticateJWT,
  authController.getMe
);

router.get(
  "/config",
  authController.getConfig
);

export default router;
