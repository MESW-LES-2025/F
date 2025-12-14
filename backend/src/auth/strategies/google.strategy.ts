import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { AuthService, GoogleUser } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor(private readonly authService: AuthService) {
		super({
			clientID: process.env.GOOGLE_CLIENT_ID || '',
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
			callbackURL: process.env.GOOGLE_CALLBACK_URL || '',
			scope: ['email', 'profile'],
		});
	}

	async validate(
		accessToken: string,
		refreshToken: string,
		profile: Profile,
		done: VerifyCallback,
	): Promise<any> {
		const { name, emails, photos, id } = profile;

		const user: GoogleUser = {
			email: emails?.[0]?.value ?? '',
			firstName: name ? name.givenName : '',
			lastName: name ? name.familyName : '',
			picture: photos?.[0]?.value ?? '',
			googleId: id,
			accessToken,
		};

		if (!user.email) {
			return done(
				new Error('No email found from Google provider'),
				undefined,
			);
		}

		const validatedUser = await this.authService.validateGoogleUser(user);
		done(null, validatedUser);
	}
}
