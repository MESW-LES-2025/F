import { PantryToItem } from '@prisma/client';

export interface PantryNotificationEvaluationInput {
  item: Pick<
    PantryToItem,
    | 'quantity'
    | 'expiryDate'
    | 'lastLowStockNotificationAt'
    | 'lastExpiryNotificationAt'
  > & {
    expiryDate: Date | null;
    lastLowStockNotificationAt: Date | null;
    lastExpiryNotificationAt: Date | null;
  };
  now: Date;
}

export interface PantryNotificationEvaluationResult {
  shouldNotifyLowStock: boolean;
  shouldNotifyExpiry: boolean;
  nextLowStockNotifiedAt?: Date;
  nextExpiryNotifiedAt?: Date;
}

const DEFAULT_LOW_STOCK_THRESHOLD = 1; // quantity <= 1   == low
const DEFAULT_NEAR_EXPIRY_DAYS = 3; // 3 days until expiry date
const DEFAULT_COOLDOWN_HOURS = 36; // 36 hour cooldown

function isCooldownOver(
  lastAt: Date | null | undefined,
  now: Date,
  cooldownHours: number,
): boolean {
  if (!lastAt) return true;
  const diffMs = now.getTime() - lastAt.getTime();
  const cooldownMs = cooldownHours * 60 * 60 * 1000;
  return diffMs >= cooldownMs;
}

function isNearExpiry(expiryDate: Date, now: Date, days: number): boolean {
  const diffMs = expiryDate.getTime() - now.getTime();
  const daysMs = days * 24 * 60 * 60 * 1000;
  return diffMs >= 0 && diffMs <= daysMs;
}

export function evaluatePantryNotifications(
  input: PantryNotificationEvaluationInput,
  options?: {
    lowStockThreshold?: number;
    nearExpiryDays?: number;
    cooldownHours?: number;
  },
): PantryNotificationEvaluationResult {
  const { item, now } = input;
  const lowStockThreshold =
    options?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const nearExpiryDays = options?.nearExpiryDays ?? DEFAULT_NEAR_EXPIRY_DAYS;
  const cooldownHours = options?.cooldownHours ?? DEFAULT_COOLDOWN_HOURS;

  let shouldNotifyLowStock = false;
  let shouldNotifyExpiry = false;
  let nextLowStockNotifiedAt: Date | undefined;
  let nextExpiryNotifiedAt: Date | undefined;

  // stock evaluation
  if (item.quantity <= lowStockThreshold) {
    const cooldownOk = isCooldownOver(
      item.lastLowStockNotificationAt ?? null,
      now,
      cooldownHours,
    );
    if (cooldownOk) {
      shouldNotifyLowStock = true;
      nextLowStockNotifiedAt = now;
    }
  }

  // expiry evaluation
  if (item.expiryDate) {
    const isNear = isNearExpiry(item.expiryDate, now, nearExpiryDays);
    if (isNear) {
      const cooldownOk = isCooldownOver(
        item.lastExpiryNotificationAt ?? null,
        now,
        cooldownHours,
      );
      if (cooldownOk) {
        shouldNotifyExpiry = true;
        nextExpiryNotifiedAt = now;
      }
    }
  }

  return {
    shouldNotifyLowStock,
    shouldNotifyExpiry,
    nextLowStockNotifiedAt,
    nextExpiryNotifiedAt,
  };
}
