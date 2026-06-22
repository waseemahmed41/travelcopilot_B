import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import tripService from "../services/trip.service";
import { z } from "zod";

export const createTripSchema = z.object({
  body: z.object({
    destination: z.string().min(2, "Destination must be at least 2 characters long"),
    days: z.number().int().min(1, "Trip duration must be at least 1 day").max(30, "Maximum duration is 30 days"),
    budgetType: z.enum(["Low", "Medium", "High"], {
      errorMap: () => ({ message: "Budget type must be 'Low', 'Medium', or 'High'" })
    }),
    interests: z.array(z.string()).min(1, "Select at least one interest tag"),
    travelStyle: z.string().optional()
  })
});

export const modifyTripSchema = z.object({
  body: z.object({
    message: z.string().min(2, "Message must be at least 2 characters long")
  }),
  params: z.object({
    id: z.string().min(1, "Trip ID parameter is required")
  })
});

export const addActivitySchema = z.object({
  body: z.object({
    dayNumber: z.number().int().min(1),
    activity: z.object({
      time: z.string().min(1, "Time is required"),
      activity: z.string().min(2, "Activity title is required"),
      description: z.string().min(2, "Description is required"),
      cost: z.number().min(0, "Cost must be positive"),
      duration: z.string().min(1, "Duration is required"),
      location: z.string().optional()
    })
  }),
  params: z.object({
    id: z.string().min(1)
  })
});

export const deleteActivitySchema = z.object({
  body: z.object({
    dayNumber: z.number().int().min(1),
    activityIndex: z.number().int().min(0)
  }),
  params: z.object({
    id: z.string().min(1)
  })
});

export const regenerateDaySchema = z.object({
  body: z.object({
    dayNumber: z.number().int().min(1),
    instruction: z.string().optional()
  }),
  params: z.object({
    id: z.string().min(1)
  })
});

export class TripController {
  public async createTrip(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const { destination, days, budgetType, interests, travelStyle } = req.body;

      const result = await tripService.createTrip(
        userId,
        destination,
        days,
        budgetType,
        interests,
        travelStyle
      );

      res.status(201).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async getTripDetails(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const result = await tripService.getTripDetails(tripId);

      // Verify that this trip belongs to the authenticated user
      if (result.trip.userId.toString() !== req.user!.id) {
        res.status(403).json({ message: "You are not authorized to view this trip" });
        return;
      }

      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async listTrips(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const skip = req.query.skip ? parseInt(req.query.skip as string) : 0;

      const result = await tripService.listTrips(userId, limit, skip);

      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async modifyTrip(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const { message } = req.body;

      // Verify owner authorization
      const tripDetails = await tripService.getTripDetails(tripId);
      if (tripDetails.trip.userId.toString() !== req.user!.id) {
        res.status(403).json({ message: "You are not authorized to modify this trip" });
        return;
      }

      const result = await tripService.modifyTripItinerary(tripId, message);

      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async addActivity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const { dayNumber, activity } = req.body;

      // Verify owner authorization
      const tripDetails = await tripService.getTripDetails(tripId);
      if (tripDetails.trip.userId.toString() !== req.user!.id) {
        res.status(403).json({ message: "You are not authorized to edit this trip" });
        return;
      }

      const result = await tripService.addActivity(tripId, dayNumber, activity);

      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteActivity(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const { dayNumber, activityIndex } = req.body;

      // Verify owner authorization
      const tripDetails = await tripService.getTripDetails(tripId);
      if (tripDetails.trip.userId.toString() !== req.user!.id) {
        res.status(403).json({ message: "You are not authorized to edit this trip" });
        return;
      }

      const result = await tripService.deleteActivity(tripId, dayNumber, activityIndex);

      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async regenerateDay(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;
      const { dayNumber, instruction } = req.body;

      // Verify owner authorization
      const tripDetails = await tripService.getTripDetails(tripId);
      if (tripDetails.trip.userId.toString() !== req.user!.id) {
        res.status(403).json({ message: "You are not authorized to edit this trip" });
        return;
      }

      const result = await tripService.regenerateDay(tripId, dayNumber, instruction);

      res.status(200).json({
        status: "success",
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  public async deleteTrip(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tripId = req.params.id;

      // Verify owner authorization
      const tripDetails = await tripService.getTripDetails(tripId);
      if (tripDetails.trip.userId.toString() !== req.user!.id) {
        res.status(403).json({ message: "You are not authorized to delete this trip" });
        return;
      }

      await tripService.deleteTrip(tripId);

      res.status(200).json({
        status: "success",
        message: "Trip successfully deleted"
      });
    } catch (error) {
      next(error);
    }
  }
}

export const tripController = new TripController();
export default tripController;
