import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { 
  PERMISSIONS_SERVICE_TOKEN
} from '../common/interfaces/user.interfaces';

@Module({
  providers: [
    PermissionsService,
    {
      provide: PERMISSIONS_SERVICE_TOKEN,
      useClass: PermissionsService,
    },
  ],
  exports: [PermissionsService, PERMISSIONS_SERVICE_TOKEN],
})
export class PermissionsModule {}
