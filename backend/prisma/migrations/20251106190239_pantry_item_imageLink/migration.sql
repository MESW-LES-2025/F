-- AlterTable
ALTER TABLE "PantryItem" ALTER COLUMN "imageLink" DROP NOT NULL;

-- DropEnum (safe for all schemas)
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT n.nspname AS schema_name, t.typname AS type_name
        FROM pg_type t
        JOIN pg_namespace n ON t.typnamespace = n.oid
        WHERE t.typname = 'unit'
    LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I.%I', r.schema_name, r.type_name);
    END LOOP;
END$$;

-- CreateIndex
CREATE INDEX "PantryItem_createdByUser_idx" ON "PantryItem"("createdByUser");

-- CreateIndex
CREATE INDEX "PantryItem_houseId_idx" ON "PantryItem"("houseId");
