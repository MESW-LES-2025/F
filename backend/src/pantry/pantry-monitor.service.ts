import { Injectable } from '@nestjs/common';
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
    const now = new Date();
    const threeDaysFromNow = new Date(
      now.getTime() + 3 * 24 * 60 * 60 * 1000,
    );
    const cooldownMs = 36 * 60 * 60 * 1000;

    const pantryItems = await this.prisma.pantryToItem.findMany({
      select: {
        id: true,
        pantryId: true,
        itemId: true,
        quantity: true,
        expiryDate: true,
        lastExpiryNotificationAt: true,
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
      const isLowStock =
        typeof pti.quantity === 'number' && pti.quantity <= 1;

      let isNearExpiry = false;
      if (pti.expiryDate) {
        isNearExpiry =
          pti.expiryDate > now && pti.expiryDate <= threeDaysFromNow;
      }

      // cooldown for expiry notifications: 36 hours
      let canNotifyExpiry = false;
      if (isNearExpiry) {
        const last = pti.lastExpiryNotificationAt;
        canNotifyExpiry =
          !last ||
          last.getTime() <= now.getTime() - cooldownMs;
      }

      if (!isLowStock && !(isNearExpiry && canNotifyExpiry)) {
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

      if (isLowStock) {
        await this.notificationsService.create({
          category: 'PANTRY',
          level: 'MEDIUM',
          title: `Pantry item (${itemName}) is near expiry`,
          body: `${itemName} is low on stock in the Pantry!`,
          userIds,
          houseId,
          actionUrl: undefined,
        });
      }

      if (isNearExpiry && canNotifyExpiry && pti.expiryDate) {
        const dateText = pti.expiryDate.toISOString().substring(0, 10);
        await this.notificationsService.create({
          category: 'PANTRY',
          level: 'MEDIUM',
          title: `Pantry item (${itemName}) is near expiry`,
          body: `${itemName} is expiring soon (expiry date: ${dateText}).`,
          userIds,
          houseId,
          actionUrl: undefined,
        });

        // Update cooldown
        await this.prisma.pantryToItem.update({
          where: { id: pti.id },
          data: { lastExpiryNotificationAt: now },
        });
      }
    }
  }
}
