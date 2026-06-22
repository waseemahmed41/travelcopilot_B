import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import { z } from "zod";

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string({
      required_error: "idToken is required"
    })
  })
});

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    name: z.string().min(2, "Name must be at least 2 characters")
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required")
  })
});

export class AuthController {
  public async signup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password, name } = req.body;
      const { token, user } = await authService.signup(email, password, name);

      res.status(201).json({
        status: "success",
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;
      const { token, user } = await authService.login(email, password);

      res.status(200).json({
        status: "success",
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async googleLogin(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { idToken } = req.body;
      const { token, user } = await authService.authenticateWithGoogle(idToken);

      res.status(200).json({
        status: "success",
        data: {
          token,
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async getMe(
    req: any,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(200).json({
        status: "success",
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }

  public async getConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      res.status(200).json({
        status: "success",
        data: {
          googleClientId: process.env.GOOGLE_CLIENT_ID || ""
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export default authController;
