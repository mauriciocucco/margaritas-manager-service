import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // removes extra properties from the request body
      forbidNonWhitelisted: true, // returns an errors if there is an extra property
      transform: true, //transform the controllers inputs to class instances or primitives
      transformOptions: {
        enableImplicitConversion: true, // transform the properties according to a class validations
      },
    }),
  );

  await app.listen(configService.get('PORT'));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'manager_queue',
      noAck: false,
      queueOptions: {
        durable: true,
      },
      prefetchCount: 10,
    },
  });

  await app.startAllMicroservices();

  console.log('Manager Service is listening...');
}
bootstrap();
