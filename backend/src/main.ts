import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, {
		bodyParser: false,
	});

	const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080';

	// CORS configuration
	app.enableCors({
		origin: allowedOrigin,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		maxAge: 3600,
		preflightContinue: false,
		optionsSuccessStatus: 204,
	});

	// Required for secure cookies behind load balancer
	app.set('trust proxy', true);

	app.use(cookieParser());

	// Secure HTTP headers
	const helmet = await import('helmet');
	app.use(helmet.default());

	// Explicitly enable JSON body parser and disable URL-encoded to prevent CSRF
	const bodyParser = await import('body-parser');
	app.use(bodyParser.json({ limit: '10mb' }));

	// Global validation pipe
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		}),
	);

	// Global prefix for all routes
	app.setGlobalPrefix('api/v1');

	// Only enable Swagger in development
	if (process.env.NODE_ENV !== 'production') {
		const config = new DocumentBuilder()
			.setTitle('Concordia API')
			.setDescription('API documentation for Concordia')
			.setVersion('1.0')
			.addBearerAuth(
				{
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					name: 'JWT',
					description: 'Enter JWT token',
					in: 'header',
				},
				'JWT-auth',
			)
			.build();

		const document = SwaggerModule.createDocument(app, config);
		SwaggerModule.setup('api/docs', app, document);
	}

	await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
