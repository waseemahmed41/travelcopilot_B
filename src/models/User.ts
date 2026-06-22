import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  googleId?: string;
  password?: string;
  name: string;
  email: string;
  picture?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  googleId: { type: String, unique: true, sparse: true, index: true },
  password: { type: String },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  picture: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const User = model<IUser>("User", userSchema);
export default User;
