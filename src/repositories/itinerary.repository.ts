import Itinerary, { IItinerary, IActivity } from "../models/Itinerary";
import { Types } from "mongoose";

export class ItineraryRepository {
  public async findByTripId(tripId: string): Promise<IItinerary[]> {
    return Itinerary.find({ tripId: new Types.ObjectId(tripId) })
      .sort({ dayNumber: 1 })
      .exec();
  }

  public async upsertDay(
    tripId: string,
    dayNumber: number,
    activities: IActivity[]
  ): Promise<IItinerary> {
    return Itinerary.findOneAndUpdate(
      { tripId: new Types.ObjectId(tripId), dayNumber },
      { activities },
      { upsert: true, new: true }
    ).exec() as Promise<IItinerary>;
  }

  public async deleteByTripId(tripId: string): Promise<any> {
    return Itinerary.deleteMany({ tripId: new Types.ObjectId(tripId) }).exec();
  }
}

export const itineraryRepository = new ItineraryRepository();
export default itineraryRepository;
