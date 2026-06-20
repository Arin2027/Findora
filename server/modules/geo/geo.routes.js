import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { searchPlaces } from "../../services/geo/geocode.service.js";

const router = Router();

router.get(
  "/search",
  asyncHandler(async (req, res) => {
    const places = await searchPlaces(req.query.q, Number(req.query.limit) || 5);
    res.json(places);
  })
);

export default router;
