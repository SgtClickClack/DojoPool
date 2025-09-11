import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WorldGateway } from './world.gateway';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    GeolocationModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [WorldGateway],
  exports: [WorldGateway],
})
export class WorldModule {}
