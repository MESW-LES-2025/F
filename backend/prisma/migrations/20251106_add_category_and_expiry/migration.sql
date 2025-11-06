-- Create PantryCategory enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pantrycategory') THEN
    CREATE TYPE "PantryCategory" AS ENUM (
      'OTHER','GRAINS','DAIRY','VEGETABLES','FRUITS','MEAT','FROZEN','CONDIMENTS','BEVERAGES'
    );
  END IF;
END$$;

-- Create Unit enum if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit') THEN
    CREATE TYPE "Unit" AS ENUM ('KG','L','ML','G','LOAF','JAR','UNITS');
  END IF;
END$$;

-- Add category column (enum) to PantryItem if missing; default to OTHER for new rows
ALTER TABLE "PantryItem" ADD COLUMN IF NOT EXISTS "category" "PantryCategory" DEFAULT 'OTHER';
-- remove the default so future inserts must set or UI will provide value
ALTER TABLE "PantryItem" ALTER COLUMN "category" DROP DEFAULT;

-- Add measurementUnit column (enum) to PantryItem if missing; default to UNITS
ALTER TABLE "PantryItem" ADD COLUMN IF NOT EXISTS "measurementUnit" "Unit" DEFAULT 'UNITS';
ALTER TABLE "PantryItem" ALTER COLUMN "measurementUnit" DROP DEFAULT;

-- Add expiryDate to PantryToItem if missing
ALTER TABLE "PantryToItem" ADD COLUMN IF NOT EXISTS "expiryDate" TIMESTAMP(3);