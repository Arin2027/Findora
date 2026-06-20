import { body } from "express-validator";

export const createItemRules = [
  body("title").trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().isString().isLength({ max: 5000 }),
  body("category").trim().notEmpty().isLength({ max: 100 }),
  body("location").trim().notEmpty().isLength({ max: 200 }),
  body("date").notEmpty().isISO8601(),
  body("type").isIn(["lost", "found"]),
];

export const updateItemRules = [
  body("title").optional().trim().notEmpty().isLength({ max: 200 }),
  body("description").optional().isString().isLength({ max: 5000 }),
  body("category").optional().trim().notEmpty().isLength({ max: 100 }),
  body("location").optional().trim().notEmpty().isLength({ max: 200 }),
  body("date").optional().isISO8601(),
  body("type").optional().isIn(["lost", "found"]),
  body("status").optional().isIn(["open", "matched", "closed"]),
];
