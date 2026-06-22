import { Router } from "express";
import dsaController from "../controllers/dsa.controller";

const router = Router();

router.get("/autocomplete", dsaController.getAutocomplete);
router.get("/recommendations", dsaController.getRecommendations);

export default router;
