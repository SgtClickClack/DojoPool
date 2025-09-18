import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Inject,
} from '@nestjs/common';
import { IPermissionsService, IPermissionsService as IPermissionsServiceToken } from '../common/interfaces/user.interfaces';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject(IPermissionsServiceToken) 
    private readonly permissionsService: IPermissionsService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!this.permissionsService.isAdmin(user)) {
      throw new ForbiddenException('Admin privileges required');
    }

    return true;
  }
}
