import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JournalService } from './journal.service';
import { UserProfileService } from './user-profile.service';
import { UserWalletService } from './user-wallet.service';
import { 
  USER_SERVICE_TOKEN,
  USER_PROFILE_SERVICE_TOKEN,
  USER_WALLET_SERVICE_TOKEN
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
      provide: USER_SERVICE_TOKEN,
      useClass: UsersService,
    },
    {
      provide: USER_PROFILE_SERVICE_TOKEN,
      useClass: UserProfileService,
    },
    {
      provide: USER_WALLET_SERVICE_TOKEN,
      useClass: UserWalletService,
    },
  ],
  exports: [
    UsersService, 
    UserProfileService, 
    UserWalletService,
    USER_SERVICE_TOKEN,
    USER_PROFILE_SERVICE_TOKEN,
    USER_WALLET_SERVICE_TOKEN,
  ],
})
export class UsersModule {}
