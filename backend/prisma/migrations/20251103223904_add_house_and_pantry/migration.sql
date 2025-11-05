-- CreateTable
CREATE TABLE "House" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "invitationCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "House_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HouseToUser" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HouseToUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pantry" (
    "id" UUID NOT NULL,
    "houseId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pantry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryItem" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "imageLink" TEXT NOT NULL,
    "measurementUnit" TEXT,

    CONSTRAINT "PantryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PantryToItem" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "pantryId" UUID NOT NULL,
    "modifiedByUser" UUID NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PantryToItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HouseToUser_userId_houseId_key" ON "HouseToUser"("userId", "houseId");

-- CreateIndex
CREATE UNIQUE INDEX "Pantry_houseId_key" ON "Pantry"("houseId");

-- CreateIndex
CREATE INDEX "Pantry_houseId_idx" ON "Pantry"("houseId");

-- CreateIndex
CREATE INDEX "PantryToItem_pantryId_idx" ON "PantryToItem"("pantryId");

-- CreateIndex
CREATE UNIQUE INDEX "PantryToItem_pantryId_itemId_key" ON "PantryToItem"("pantryId", "itemId");

-- AddForeignKey
ALTER TABLE "HouseToUser" ADD CONSTRAINT "HouseToUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HouseToUser" ADD CONSTRAINT "HouseToUser_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pantry" ADD CONSTRAINT "Pantry_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryToItem" ADD CONSTRAINT "PantryToItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "PantryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryToItem" ADD CONSTRAINT "PantryToItem_pantryId_fkey" FOREIGN KEY ("pantryId") REFERENCES "Pantry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PantryToItem" ADD CONSTRAINT "PantryToItem_modifiedByUser_fkey" FOREIGN KEY ("modifiedByUser") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
