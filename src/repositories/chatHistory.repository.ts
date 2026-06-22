import ChatHistory, { IChatHistory } from "../models/ChatHistory";
import { Types } from "mongoose";

export class ChatHistoryRepository {
  public async findByTripId(tripId: string): Promise<IChatHistory[]> {
    return ChatHistory.find({ tripId: new Types.ObjectId(tripId) })
      .sort({ timestamp: 1 })
      .exec();
  }

  public async addMessage(
    tripId: string,
    role: "user" | "model" | "assistant",
    message: string
  ): Promise<IChatHistory> {
    const chat = new ChatHistory({
      tripId: new Types.ObjectId(tripId),
      role,
      message,
      timestamp: new Date()
    });
    return chat.save();
  }

  public async deleteByTripId(tripId: string): Promise<any> {
    return ChatHistory.deleteMany({ tripId: new Types.ObjectId(tripId) }).exec();
  }
}

export const chatHistoryRepository = new ChatHistoryRepository();
export default chatHistoryRepository;
