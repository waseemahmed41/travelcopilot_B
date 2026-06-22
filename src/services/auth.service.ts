import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import userRepository from "../repositories/user.repository";
import { IUser } from "../models/User";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_token_key_12345";

export interface GooglePayload {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

export class AuthService {
  /**
   * Registers a user via email/password credentials
   */
  public async signup(email: string, password: string, name: string): Promise<{ token: string; user: IUser }> {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error("A user with this email address already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const picture = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

    const user = await userRepository.create({
      email,
      password: hashedPassword,
      name,
      picture
    });

    const token = this.generateToken(user);
    return { token, user };
  }

  /**
   * Authenticats a user via email/password credentials
   */
  public async login(email: string, password: string): Promise<{ token: string; user: IUser }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.password) {
      throw new Error("This account is configured with Google OAuth. Please sign in with Google.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  /**
   * Verifies Google OAuth 2.0 ID Token or parses fallback mock token
   */
  public async verifyGoogleToken(idToken: string): Promise<GooglePayload> {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    // Support mock auth for developers if client ID is missing or if token is explicitly a mock token
    if (!clientId || clientId === "your_google_client_id_here" || idToken.startsWith("mock_token_")) {
      console.warn("Running Google OAuth in mock/fallback mode.");
      
      // Extract profile details from mock token format
      // mock_token_waseem@example.com_WaseemAhmed
      const parts = idToken.split("_");
      const email = parts[2] || "waseem@example.com";
      const name = parts[3] || "Waseem Ahmed";
      const googleId = `google_mock_${email.replace("@", "_")}`;
      const picture = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`;

      return {
        googleId,
        email,
        name,
        picture
      };
    }

    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email || !payload.name) {
        throw new Error("Invalid Google token payload");
      }

      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      };
    } catch (error) {
      console.error("Google token verification failed:", error);
      throw new Error("Failed to verify Google token");
    }
  }

  /**
   * Authenticates user using Google credentials, finding/creating db record
   */
  public async authenticateWithGoogle(idToken: string): Promise<{ token: string; user: IUser }> {
    const payload = await this.verifyGoogleToken(idToken);
    
    let user = await userRepository.findByGoogleId(payload.googleId);
    if (!user) {
      // Check if user already exists with email
      user = await userRepository.findByEmail(payload.email);
      if (user) {
        // Link googleId to existing email
        user.googleId = payload.googleId;
        if (payload.picture && !user.picture) {
          user.picture = payload.picture;
        }
        await user.save();
      } else {
        user = await userRepository.create({
          googleId: payload.googleId,
          email: payload.email,
          name: payload.name,
          picture: payload.picture
        });
      }
    } else if (payload.picture && user.picture !== payload.picture) {
      // Update profile picture if changed
      const updatedUser = await userRepository.updatePicture(user._id.toString(), payload.picture);
      if (updatedUser) {
        user = updatedUser;
      }
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  /**
   * Generates a signed JWT for local session maintenance
   */
  public generateToken(user: IUser): string {
    return jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  /**
   * Verifies JWT token and decodes payload
   */
  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }
}

export const authService = new AuthService();
export default authService;
