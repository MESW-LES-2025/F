import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
	handleRequest(err: any, user: any) {
		if (err || !user) {
			return null;
		}
		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return user;
	}
}
