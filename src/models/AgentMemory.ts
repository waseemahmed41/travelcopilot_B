import { Schema, model, Document, Types } from "mongoose";

export interface IAgentMemory extends Document {
  tripId: Types.ObjectId;
  agentName: string;
  response: any; // Storing the structured JSON objects returned by agents
  timestamp: Date;
}

const agentMemorySchema = new Schema<IAgentMemory>({
  tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
  agentName: { type: String, required: true },
  response: { type: Schema.Types.Mixed, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Compound index so that we look up a specific agent's response for a trip fast
agentMemorySchema.index({ tripId: 1, agentName: 1 }, { unique: true });

export const AgentMemory = model<IAgentMemory>("AgentMemory", agentMemorySchema);
export default AgentMemory;
