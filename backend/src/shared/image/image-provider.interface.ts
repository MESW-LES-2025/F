import { MulterFile } from '../types/multer_file.js';

export interface ImageProvider {
	upload(
		file: MulterFile,
		subPath?: string,
	): Promise<{ url: string; publicId: string }>;
	delete(publicId: string): Promise<void>;
}
