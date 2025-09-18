import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from './journal.service';
import { UserProfileService } from './user-profile.service';
import { UserWalletService } from './user-wallet.service';
import { 
  IUserService, 
  IUserProfileService, 
  IUserWalletService,
  IUserService as IUserServiceToken,
  IUserProfileService as IUserProfileServiceToken,
  IUserWalletService as IUserWalletServiceToken
} from '../common/interfaces/user.interfaces';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService, 
    PrismaService, 
    JournalService, 
    UserProfileService, 
    UserWalletService,
    // Provide concrete implementations for interfaces
    {
      provide: IUserServiceToken,
      useClass: UsersService,
    },
    {
      provide: IUserProfileServiceToken,
      useClass: UserProfileService,
    },
    {
      provide: IUserWalletServiceToken,
      useClass: UserWalletService,
    },
  ],
  exports: [
    UsersService, 
    UserProfileService, 
    UserWalletService,
    IUserServiceToken,
    IUserProfileServiceToken,
    IUserWalletServiceToken,
  ],
})
export class UsersModule {}
