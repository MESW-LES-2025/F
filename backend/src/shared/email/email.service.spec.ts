import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import sgMail from '@sendgrid/mail';

jest.mock('@sendgrid/mail', () => ({
	setApiKey: jest.fn(),
	send: jest.fn(),
}));

describe('EmailService', () => {
	let service: EmailService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [EmailService],
		}).compile();

		service = module.get<EmailService>(EmailService);
		jest.clearAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('sendEmail', () => {
		it('should send email successfully', async () => {
			(sgMail.send as unknown as jest.Mock).mockResolvedValue([
				{ statusCode: 202, body: {} },
			]);

			const result = await service.sendEmail(
				'test@example.com',
				'Test Subject',
				'<p>Test Body</p>',
			);

			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(sgMail.send as unknown as jest.Mock).toHaveBeenCalledWith({
				to: 'test@example.com',
				from: expect.any(String) as unknown,
				subject: 'Test Subject',
				html: '<p>Test Body</p>',
			});
			expect(result).toEqual({ success: true });
		});

		it('should throw error if sending fails', async () => {
			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});
			(sgMail.send as unknown as jest.Mock).mockRejectedValue(
				new Error('SendGrid Error'),
			);

			await expect(
				service.sendEmail(
					'test@example.com',
					'Test Subject',
					'<p>Test Body</p>',
				),
			).rejects.toThrow('Failed to send email');

			expect(consoleSpy).toHaveBeenCalled();
			consoleSpy.mockRestore();
		});
	});
});
