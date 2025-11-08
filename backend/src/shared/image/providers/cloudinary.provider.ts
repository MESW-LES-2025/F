import { v2 as cloudinary } from 'cloudinary';
import { ImageProvider } from '../image-provider.interface';
import { MulterFile } from 'src/shared/types/multer_file';

export class CloudinaryImageProvider implements ImageProvider {
	private readonly mainFolder: string;

	constructor() {
		cloudinary.config({
			cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
			api_key: process.env.CLOUDINARY_API_KEY,
			api_secret: process.env.CLOUDINARY_API_SECRET,
		});
		this.mainFolder = process.env.APP_NAME || 'Concordia';
	}

	async upload(
		file: MulterFile,
		subPath?: string,
	): Promise<{ url: string; publicId: string }> {
		const fileName = file.originalname.split('.')[0];
		const publicId = subPath ? `${subPath}/${fileName}` : fileName;
		return new Promise((resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ folder: this.mainFolder, public_id: publicId },
				(err, result) => {
					if (err)
						return reject(
							new Error(err.message || 'Cloudinary upload error'),
						);
					if (!result)
						return reject(
							new Error(
								'Cloudinary upload failed: no result returned',
							),
						);
					const optimizedUrl = cloudinary.url(result.public_id, {
						folder: this.mainFolder,
						secure: true,
						transformation: [
							{ quality: 'auto' }, // auto compression
							{ fetch_format: 'auto' }, // auto format
						],
					});
					resolve({
						url: optimizedUrl,
						publicId: result.public_id,
					});
				},
			);

			stream.end(file.buffer);
		});
	}

	async delete(publicId: string): Promise<void> {
		await cloudinary.uploader.destroy(publicId);
	}
}
