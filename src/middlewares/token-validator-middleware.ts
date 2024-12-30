import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config'; // Import ConfigService
import { authenticationConstants } from 'src/utils/constants';
import mongoose from 'mongoose';

@Injectable()
export class TokenValidator implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inject ConfigService
  ) {}

  use(req: decodedRequest, res: Response, next: NextFunction) {
    const { headers } = req;
    const authorizationHeader = headers.cookie;

    if (!authorizationHeader) {
      return res
        .status(401)
        .json({ message: authenticationConstants.errors.missingAuthHeaders });
    }

    const [bearer, token] = authorizationHeader.split('=');

    if (bearer !== 'token' || !token) {
      return res.status(401).json({
        message: authenticationConstants.errors.invalidAuthHeaderFormat,
      });
    }
    const secret = this.configService.get<string>('JWT_SECRET') || ''; // Get JWT_SECRET from environment

    try {
      const decodedToken = this.jwtService.verify(token, { secret });
      req.user = {
        ...decodedToken,
        userId: new mongoose.Types.ObjectId(decodedToken.userId),
      }; // Add decoded token to the request object
      // You can access the decoded token properties if needed
      // For example: const userId = decodedToken.sub;
      next();
    } catch (error) {
      console.error('Token Verification Error:', error.message);
      // Handle token verification failure (e.g., unauthorized access)
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }
}

type TokenReq = {
  user?: any;
};

export type decodedRequest = TokenReq & Request;
