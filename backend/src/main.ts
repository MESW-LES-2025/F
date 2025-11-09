import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Parse the environment variable for CORS origin pattern
  	const corsOriginPattern = process.env.CORS_ORIGIN;

	// Convert the placeholder * into a proper regex
	const regex = corsOriginPattern
		? new RegExp('^' + corsOriginPattern.replace(/\*/g, '.*') + '$')
		: null;
	
	const fallbackOrigin = 'http://localhost:8080';

	// CORS configuration
	app.enableCors({
  		origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
			if (!origin) return callback(null, true);
			if (regex?.test(origin)) return callback(null, true);
			if (origin === fallbackOrigin) return callback(null, true);
			return callback(new Error(`CORS not allowed for origin: ${origin}`), false);
		},
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		maxAge: 3600,
	});

	// Global prefix for all routes
	app.setGlobalPrefix('api/v1');

	// Swagger configuration
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

	await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
