import {
	Controller,
	Get,
	Patch,
	Delete,
	Body,
	UseGuards,
	Request,
	Post,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UserRequest } from 'src/shared/types/user_request';
import { JoinHouseDto } from './dto/join-house.dto';

@Controller('user')
export class UserController {
	constructor(private readonly userService: UserService) {}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Get current authenticated user' })
	@Get()
	async getCurrent(@Request() req: UserRequest) {
		return await this.userService.findOne(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Update current authenticated user' })
	@Patch()
	async updateCurrent(
		@Request() req: UserRequest,
		@Body() updateUserDto: UpdateUserDto,
	) {
		return await this.userService.update(req.user.userId, updateUserDto);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Delete current authenticated user' })
	@Delete()
	async removeCurrent(@Request() req: UserRequest) {
		return await this.userService.remove(req.user.userId);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Upload or replace user avatar image' })
	@Post('upload-image')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
		}),
	)
	async uploadImage(
		@Request() req: UserRequest,
		@UploadedFile() file: Express.Multer.File,
	) {
		return await this.userService.uploadImage(req.user.userId, file);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'User can use an invite code to join a house' })
	@Post('join-house')
	async joinHouse(
		@Request() req: UserRequest,
		@Body() joinHouseDto: JoinHouseDto,
	) {
		return await this.userService.joinHouseWithCode(
			req.user.userId,
			joinHouseDto,
		);
	}
}
