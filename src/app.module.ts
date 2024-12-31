import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { ChartsModule } from './charts/charts.module';
import { EmailModule } from './email/email.module';
import { TokenValidator } from './middlewares/token-validator-middleware';
import { ProfileModule } from './profile/profile.module';
import { SourcesModule } from './sources/sources.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [
    ProfileModule,
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigModule globally available
      envFilePath: '.env.local', // Path to your .env file
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET')!,
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get(
          'MONGODB_CONNECTION_STRING',
        )!;
        return {
          uri: connectionString,
        };
      },
      inject: [ConfigService],
    }),
    CategoryModule,
    EmailModule,
    ChartsModule,
    TransactionModule,
    SourcesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenValidator)
      .exclude('/login', '/register')
      .forRoutes('*');
  }
}
