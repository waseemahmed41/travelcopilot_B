import { Schema, model, Document, Types } from "mongoose";

export interface IActivity {
  time: string;
  activity: string;
  description: string;
  cost: number;
  duration: string;
  location?: string;
}

export interface IItinerary extends Document {
  tripId: Types.ObjectId;
  dayNumber: number;
  activities: IActivity[];
}

const activitySchema = new Schema<IActivity>({
  time: { type: String, required: true },
  activity: { type: String, required: true },
  description: { type: String, required: true },
  cost: { type: Number, required: true, default: 0 },
  duration: { type: String, required: true },
  location: { type: String }
});

const itinerarySchema = new Schema<IItinerary>({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  dayNumber: { type: Number, required: true },
  activities: { type: [activitySchema], default: [] }
});

// Ensure a compound index so that we load days in order quickly
itinerarySchema.index({ tripId: 1, dayNumber: 1 }, { unique: true });

export const Itinerary = model<IItinerary>("Itinerary", itinerarySchema);
export default Itinerary;
