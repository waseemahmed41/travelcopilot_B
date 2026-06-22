import AgentMemory, { IAgentMemory } from "../models/AgentMemory";
import { Types } from "mongoose";

export class AgentMemoryRepository {
  public async findByTripId(tripId: string): Promise<IAgentMemory[]> {
    return AgentMemory.find({ tripId: new Types.ObjectId(tripId) }).exec();
  }

  public async findByTripAndAgent(
    tripId: string,
    agentName: string
  ): Promise<IAgentMemory | null> {
    return AgentMemory.findOne({
      tripId: new Types.ObjectId(tripId),
      agentName
    }).exec();
  }

  public async upsertMemory(
    tripId: string,
    agentName: string,
    response: any
  ): Promise<IAgentMemory> {
    return AgentMemory.findOneAndUpdate(
      { tripId: new Types.ObjectId(tripId), agentName },
      { response, timestamp: new Date() },
      { upsert: true, new: true }
    ).exec() as Promise<IAgentMemory>;
  }

  public async deleteByTripId(tripId: string): Promise<any> {
    return AgentMemory.deleteMany({ tripId: new Types.ObjectId(tripId) }).exec();
  }
}

export const agentMemoryRepository = new AgentMemoryRepository();
export default agentMemoryRepository;
