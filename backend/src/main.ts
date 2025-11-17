import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:8080';

	// CORS configuration
	app.enableCors({
		origin: allowedOrigin,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		maxAge: 3600,
	});

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
