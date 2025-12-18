import { useState, ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HousePlusIcon } from "lucide-react";
import { houseService } from "@/lib/house-service";
import { useRouter } from "next/navigation";

interface CreateHouseFormProps {
  isRegister?: boolean;
}

export function CreateHouseForm({ isRegister = false }: CreateHouseFormProps) {
  const router = useRouter();
  const [houseName, setHouseName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorCreate, setErrorCreate] = useState<string | null>(null);
  const [successMessageCreate, setSuccessMessageCreate] = useState<
    string | null
  >(null);

  const handleCreateHouse = async () => {
    setErrorCreate(null);
    setSuccessMessageCreate(null);

    if (!houseName) {
      setErrorCreate("Cannot create a house without a name");
      return;
    }

    setIsSaving(true);

    try {
      const response = await houseService.create({ name: houseName });

      if (response) {
        setSuccessMessageCreate(
          `House created successfully! Use the code ${response.invitationCode} to invite others.`,
        );
        if (isRegister) {
          router.push(`/?houseId=${response.id}`);
        }
      } else {
        setErrorCreate("Not able to create the house, try again later");
      }
    } catch (err) {
      setErrorCreate(
        err instanceof Error ? err.message : "Failed to create house",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <HousePlusIcon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Create a new house</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="house-name">House Name</Label>
          <Input
            id="house-name"
            value={houseName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHouseName(e.target.value)
            }
          />
        </div>

        <Button
          id="create-house-btn"
          onClick={handleCreateHouse}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        {successMessageCreate && (
          <Alert>
            <AlertDescription id="create-house-success">
              {successMessageCreate}
            </AlertDescription>
          </Alert>
        )}

        {errorCreate && (
          <Alert variant="destructive">
            <AlertDescription>{errorCreate}</AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
