import { useState, ChangeEvent } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HouseIcon } from "lucide-react";
import { userService } from "@/lib/user-service";
import { useRouter } from "next/navigation";

interface JoinHouseFormProps {
  isRegister?: boolean;
}

export function JoinHouseForm({ isRegister = false }: JoinHouseFormProps) {
  const router = useRouter();
  const [houseCode, setHouseCode] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorJoin, setErrorJoin] = useState<string | null>(null);
  const [successMessageJoin, setSuccessMessageJoin] = useState<string | null>(
    null
  );

  const handleJoinHouse = async () => {
    setErrorJoin(null);
    setSuccessMessageJoin(null);

    if (!houseCode) {
      setErrorJoin("Please fill the code");
      return;
    }

    setIsSaving(true);

    try {
      const response = await userService.joinHouse({ inviteCode: houseCode });

      if (response.houseId) {
        setSuccessMessageJoin("Joined new house");
        if (isRegister) {
          router.push(`/?houseId=${response.houseId}`);
        }
      } else {
        setErrorJoin("Not able to join house, try again later");
      }
    } catch (err) {
      setErrorJoin(err instanceof Error ? err.message : "Failed to join house");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <HouseIcon className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Join an existing house</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="house-code">House Code</Label>
          <Input
            id="house-code"
            value={houseCode}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setHouseCode(e.target.value)
            }
          />
        </div>

        <Button onClick={handleJoinHouse} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        {successMessageJoin && (
          <Alert>
            <AlertDescription>{successMessageJoin}</AlertDescription>
          </Alert>
        )}

        {errorJoin && (
          <Alert variant="destructive">
            <AlertDescription>{errorJoin}</AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
}
