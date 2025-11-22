import { Injectable } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
	constructor() {
		sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
	}

	async sendEmail(to: string, subject: string, html: string) {
		const msg = {
			to,
			from: process.env.SENDGRID_FROM || '',
			subject,
			html,
		};

		try {
			await sgMail.send(msg);
			return { success: true };
		} catch (error) {
			console.error('SendGrid Error:', error);
			throw new Error('Failed to send email');
		}
	}
}
