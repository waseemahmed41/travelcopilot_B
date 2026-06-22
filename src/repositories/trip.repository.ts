import Trip, { ITrip } from "../models/Trip";
import { Types } from "mongoose";

export class TripRepository {
  public async findById(id: string): Promise<ITrip | null> {
    return Trip.findById(id).exec();
  }

  public async findByUser(
    userId: string,
    limit = 10,
    skip = 0
  ): Promise<ITrip[]> {
    return Trip.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  public async countByUser(userId: string): Promise<number> {
    return Trip.countDocuments({ userId: new Types.ObjectId(userId) }).exec();
  }

  public async create(tripData: Partial<ITrip>): Promise<ITrip> {
    const trip = new Trip(tripData);
    return trip.save();
  }

  public async updateHealthScore(id: string, score: number): Promise<ITrip | null> {
    return Trip.findByIdAndUpdate(id, { tripHealthScore: score }, { new: true }).exec();
  }

  public async delete(id: string): Promise<ITrip | null> {
    return Trip.findByIdAndDelete(id).exec();
  }
}

export const tripRepository = new TripRepository();
export default tripRepository;
