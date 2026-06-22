import { Schema, model, Document, Types } from "mongoose";

export interface IChatHistory extends Document {
  tripId: Types.ObjectId;
  role: "user" | "model" | "assistant";
  message: string;
  timestamp: Date;
}

const chatHistorySchema = new Schema<IChatHistory>({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  role: { type: String, enum: ["user", "model", "assistant"], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export const ChatHistory = model<IChatHistory>("ChatHistory", chatHistorySchema);
export default ChatHistory;
