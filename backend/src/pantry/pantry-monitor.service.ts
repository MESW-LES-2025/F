import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class PantryMonitorService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1PM)
  async handlePantryCheck() {
    const pantryItems = await this.prisma.pantryToItem.findMany({
      select: {
        id: true,
        pantryId: true,
        itemId: true,
        quantity: true,
        pantry: {
          select: {
            houseId: true,
          },
        },
        item: {
          select: {
            name: true,
            measurementUnit: true,
          },
        },
      },
    });

    for (const pti of pantryItems) {
      if (typeof pti.quantity !== 'number' || pti.quantity > 1) {
        continue;
      }

      const houseId = pti.pantry.houseId;

      const houseUsers = await this.prisma.houseToUser.findMany({
        where: { houseId },
        select: { userId: true },
      });

      const userIds = houseUsers.map((u) => u.userId);
      if (userIds.length === 0) continue;

      const itemName = pti.item?.name ?? 'Pantry item';
      const unit = pti.item?.measurementUnit ?? '';
      const quantityText =
        unit && typeof pti.quantity === 'number'
          ? `${pti.quantity} ${unit}`
          : `${pti.quantity}`;

      await this.notificationsService.create({
        category: 'PANTRY',
        level: 'MEDIUM',
        title: 'Pantry item is low on stock',
        body: `${itemName} is low on stock in the Pantry!`,
        userIds,
        houseId,
        actionUrl: undefined,
      });
    }
  }
}
