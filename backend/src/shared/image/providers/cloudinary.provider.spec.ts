import { CloudinaryImageProvider } from './cloudinary.provider';
import { v2 as cloudinary } from 'cloudinary';
import { MulterFile } from 'src/shared/types/multer_file';

jest.mock('cloudinary', () => ({
	v2: {
		config: jest.fn(),
		uploader: {
			upload_stream: jest.fn(),
			destroy: jest.fn(),
		},
		url: jest.fn(),
	},
}));

describe('CloudinaryImageProvider', () => {
	let provider: CloudinaryImageProvider;

	beforeEach(() => {
		jest.clearAllMocks();
		provider = new CloudinaryImageProvider();
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});

	describe('upload', () => {
		it('should upload file successfully', async () => {
			const file = {
				originalname: 'test.png',
				buffer: Buffer.from('test'),
			} as unknown as MulterFile;

			const mockStream = {
				end: jest.fn(),
			};

			(
				cloudinary.uploader.upload_stream as unknown as jest.Mock
			).mockImplementation(
				(options, callback: (err: any, result: any) => void) => {
					callback(null, { public_id: 'test_id' });
					return mockStream;
				},
			);

			(cloudinary.url as unknown as jest.Mock).mockReturnValue(
				'http://optimized-url',
			);

			const result = await provider.upload(file, 'sub');

			expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
				expect.objectContaining({
					folder: expect.any(String) as unknown,
					public_id: 'sub/test',
				}),
				expect.any(Function),
			);
			expect(mockStream.end).toHaveBeenCalledWith(file.buffer);
			expect(result).toEqual({
				url: 'http://optimized-url',
				publicId: 'test_id',
			});
		});

		it('should handle upload error', async () => {
			const file = {
				originalname: 'test.png',
				buffer: Buffer.from('test'),
			} as unknown as MulterFile;

			const mockStream = {
				end: jest.fn(),
			};

			(
				cloudinary.uploader.upload_stream as unknown as jest.Mock
			).mockImplementation(
				(options, callback: (err: any, result: any) => void) => {
					callback(new Error('Upload failed'), null);
					return mockStream;
				},
			);

			await expect(provider.upload(file)).rejects.toThrow(
				'Upload failed',
			);
		});
	});

	describe('delete', () => {
		it('should delete image', async () => {
			(
				cloudinary.uploader.destroy as unknown as jest.Mock
			).mockResolvedValue({
				result: 'ok',
			});

			await provider.delete('id');

			expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('id');
		});
	});
});
