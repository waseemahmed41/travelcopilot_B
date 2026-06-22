import User, { IUser } from "../models/User";

export class UserRepository {
  public async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  public async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email }).exec();
  }

  public async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId }).exec();
  }

  public async create(userData: Partial<IUser>): Promise<IUser> {
    const user = new User(userData);
    return user.save();
  }

  public async updatePicture(id: string, picture: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { picture }, { new: true }).exec();
  }
}

export const userRepository = new UserRepository();
export default userRepository;
