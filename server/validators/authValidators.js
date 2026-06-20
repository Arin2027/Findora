import { body } from "express-validator";

export const registerRules = [
  body("email").isEmail().normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Za-z]/)
    .withMessage("Password must contain a letter")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
];

export const loginRules = [body("email").isEmail().normalizeEmail(), body("password").notEmpty()];
