import { Injectable } from '@nestjs/common';
import { ImageProvider } from './image-provider.interface';
import { CloudinaryImageProvider } from './providers/cloudinary.provider';
import { MulterFile } from 'src/shared/types/multer_file';

@Injectable()
export class ImageService {
	private readonly provider: ImageProvider;

	constructor() {
		this.provider = new CloudinaryImageProvider();
	}

	/**
	 * Upload a file
	 * @param file - Multer file
	 * @param subPath - optional subfolder
	 */
	async uploadImage(file: MulterFile, subPath?: string) {
		return this.provider.upload(file, subPath);
	}

	/**
	 * Delete a file by its Cloudinary publicId
	 */
	async deleteImage(publicId: string) {
		return this.provider.delete(publicId);
	}
}
