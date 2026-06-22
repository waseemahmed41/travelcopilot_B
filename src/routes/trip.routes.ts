import { Router } from "express";
import tripController, {
  createTripSchema,
  modifyTripSchema,
  addActivitySchema,
  deleteActivitySchema,
  regenerateDaySchema
} from "../controllers/trip.controller";
import { validateRequest } from "../middlewares/validate.middleware";
import { authenticateJWT } from "../middlewares/auth.middleware";
import { apiLimiter } from "../middlewares/limit.middleware";

const router = Router();

// Apply auth for all trip actions
router.use(authenticateJWT);

router.post(
  "/",
  apiLimiter,
  validateRequest(createTripSchema),
  tripController.createTrip
);

router.get(
  "/",
  tripController.listTrips
);

router.get(
  "/:id",
  tripController.getTripDetails
);

router.put(
  "/:id",
  apiLimiter,
  validateRequest(modifyTripSchema),
  tripController.modifyTrip
);

router.post(
  "/:id/activity",
  apiLimiter,
  validateRequest(addActivitySchema),
  tripController.addActivity
);

router.post(
  "/:id/activity/delete",
  apiLimiter,
  validateRequest(deleteActivitySchema),
  tripController.deleteActivity
);

router.post(
  "/:id/regenerate-day",
  apiLimiter,
  validateRequest(regenerateDaySchema),
  tripController.regenerateDay
);

router.delete(
  "/:id",
  tripController.deleteTrip
);

export default router;
