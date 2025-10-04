import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    username: string;
    // add other user properties if needed
  };
}
