import {
	Controller,
	Get,
	Post,
	Body,
	Patch,
	Param,
	Request,
	Query,
	UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UserRequest } from 'src/shared/types/user_request';
import { FindAllNotificationsByUserDto } from './dto/find-all-by-user.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Create a new notification' })
	@Post()
	create(@Body() createNotificationDto: CreateNotificationDto) {
		return this.notificationsService.create(createNotificationDto);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Find all notifications to a user' })
	@Get()
	findAllByUser(
		@Request() req: UserRequest,
		@Query() filters: FindAllNotificationsByUserDto,
	) {
		return this.notificationsService.findAllByUser(
			req.user.userId,
			filters,
		);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Find one notification to a user' })
	@Get(':id')
	findOneByUser(@Param('id') id: string, @Request() req: UserRequest) {
		return this.notificationsService.findOneByUser(req.user.userId, id);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Mark one notification to a user as read' })
	@Patch(':id')
	markOneAsReadByUser(@Param('id') id: string, @Request() req: UserRequest) {
		return this.notificationsService.markOneAsReadByUser(
			req.user.userId,
			id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Dismiss one notification for a user' })
	@Patch(':id/dismiss')
	dismissOneByUser(@Param('id') id: string, @Request() req: UserRequest) {
		return this.notificationsService.dismissOneByUser(
			req.user.userId,
			id,
		);
	}

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth('JWT-auth')
	@ApiOperation({ summary: 'Mark all notifications to a user as read' })
	@Patch()
	markAllAsReadByUser(@Request() req: UserRequest) {
		return this.notificationsService.markAllAsReadByUser(req.user.userId);
	}
}
