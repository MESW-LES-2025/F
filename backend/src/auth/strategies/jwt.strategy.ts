import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private prisma: PrismaService) {
		super({
			jwtFromRequest: ExtractJwt.fromExtractors([
				(request: Request) => {
					return (request?.cookies?.access_token as string) || null;
				},
			]),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
		});
	}

	async validate(payload: { sub: string; email: string }) {
		const user = await this.prisma.user.findFirst({
			where: { id: payload.sub, deletedAt: null },
		});

		if (!user) {
			throw new UnauthorizedException();
		}

		return {
			userId: user.id,
			email: user.email,
			username: user.username,
		} as { userId: string; email: string; username: string };
	}
}
