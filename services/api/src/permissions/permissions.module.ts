import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { 
  IPermissionsService,
  IPermissionsService as IPermissionsServiceToken
} from '../common/interfaces/user.interfaces';

@Module({
  providers: [
    PermissionsService,
    {
      provide: IPermissionsServiceToken,
      useClass: PermissionsService,
    },
  ],
  exports: [PermissionsService, IPermissionsServiceToken],
})
export class PermissionsModule {}
