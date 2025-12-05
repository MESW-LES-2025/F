import { Test, TestingModule } from '@nestjs/testing';
import { ImageService } from './image.service';
import { CloudinaryImageProvider } from './providers/cloudinary.provider';
import { MulterFile } from 'src/shared/types/multer_file';

jest.mock('./providers/cloudinary.provider');

describe('ImageService', () => {
	let service: ImageService;
	let mockProvider: jest.Mocked<CloudinaryImageProvider>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [ImageService],
		}).compile();

		service = module.get<ImageService>(ImageService);
		// Access the private provider instance (casted for testing)
		mockProvider = (
			service as unknown as { provider: CloudinaryImageProvider }
		).provider as jest.Mocked<CloudinaryImageProvider>;
		mockProvider.upload = jest.fn();
		mockProvider.delete = jest.fn();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('uploadImage', () => {
		it('should call provider.upload', async () => {
			const file = {
				buffer: Buffer.from('test'),
			} as unknown as MulterFile;
			mockProvider.upload.mockResolvedValue({
				url: 'http://url',
				publicId: 'id',
			});

			const result = await service.uploadImage(file, 'sub');

			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(mockProvider.upload as jest.Mock).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(mockProvider.upload as jest.Mock).toHaveBeenCalledWith(
				file,
				'sub',
			);
			expect(result).toEqual({ url: 'http://url', publicId: 'id' });
		});
	});

	describe('deleteImage', () => {
		it('should call provider.delete', async () => {
			mockProvider.delete.mockResolvedValue(undefined);

			await service.deleteImage('id');

			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(mockProvider.delete as jest.Mock).toBeDefined();
			// eslint-disable-next-line @typescript-eslint/unbound-method
			expect(mockProvider.delete as jest.Mock).toHaveBeenCalledWith('id');
		});
	});
});
