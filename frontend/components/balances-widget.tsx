"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  getBalances,
  type Balance,
  type Settlement,
} from "@/lib/expense-service";
import { Separator } from "@/components/ui/separator";
import { SettlementDialog } from "@/components/settlement-dialog";
import { ManualSettlementDialog } from "@/components/manual-settlement-dialog";

interface BalancesWidgetProps {
  houseId: string;
  onRefresh?: () => void;
}

export function BalancesWidget({ houseId, onRefresh }: BalancesWidgetProps) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const data = await getBalances(houseId);
      setBalances(data.balances);
      setSettlements(data.settlements);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettled = () => {
    fetchBalances();
    onRefresh?.();
  };

  useEffect(() => {
    if (houseId) {
      fetchBalances();
    }
  }, [houseId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Balances & Settlements</CardTitle>
          <CardDescription>Who owes what</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Balances & Settlements</CardTitle>
            <CardDescription>
              Who owes what and suggested settlements
            </CardDescription>
          </div>
          <ManualSettlementDialog onSettled={handleSettled} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Balances */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Member Balances</h3>
          <div className="space-y-2">
            {balances.map((balance) => (
              <div
                key={balance.userId}
                className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={balance.userImageUrl || undefined} />
                    <AvatarFallback>
                      {balance.userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {balance.userName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {balance.balance > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-600">
                        ${Math.abs(balance.balance).toFixed(2)}
                      </span>
                    </>
                  ) : balance.balance < 0 ? (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-600">
                        -${Math.abs(balance.balance).toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Settled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settlements */}
        {settlements.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Suggested Settlements</h3>
              <div className="space-y-2">
                {settlements.map((settlement, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium">
                        {settlement.fromName}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {settlement.toName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        ${settlement.amount.toFixed(2)}
                      </span>
                      <SettlementDialog
                        settlement={settlement}
                        onSettled={handleSettled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {balances.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No expenses yet. Add expenses to see balances.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
