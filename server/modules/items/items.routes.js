import { Router } from "express";
import { authRequired } from "../../middleware/auth.js";
import { uploadItemImage } from "../../middleware/upload.js";
import { cloudinaryUploadMiddleware } from "../../middleware/cloudinaryUpload.js";
import { createItemRules, updateItemRules } from "../../validators/itemValidators.js";
import * as ctrl from "./items.controller.js";

const router = Router();
const withUpload = [uploadItemImage.single("image"), cloudinaryUploadMiddleware];

router.get("/", ctrl.listItems);
router.get("/nearby", ctrl.listNearby);
router.get("/mine", authRequired, ctrl.listMyItems);
router.get("/:id", ctrl.getItem);
router.post("/", authRequired, ...withUpload, ...createItemRules, ctrl.createItem);
router.patch("/:id", authRequired, ...withUpload, ...updateItemRules, ctrl.updateItem);
router.delete("/:id", authRequired, ctrl.deleteItem);

export default router;
