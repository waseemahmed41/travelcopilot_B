import { Schema, model, Document, Types } from "mongoose";

export interface ITrip extends Document {
  userId: Types.ObjectId;
  destination: string;
  days: number;
  budgetType: "Low" | "Medium" | "High";
  interests: string[];
  travelStyle?: string;
  tripHealthScore: number;
  createdAt: Date;
}

const tripSchema = new Schema<ITrip>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  destination: { type: String, required: true },
  days: { type: Number, required: true },
  budgetType: { type: String, enum: ["Low", "Medium", "High"], required: true },
  interests: { type: [String], default: [] },
  travelStyle: { type: String },
  tripHealthScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export const Trip = model<ITrip>("Trip", tripSchema);
export default Trip;
