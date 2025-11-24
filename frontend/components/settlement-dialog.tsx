'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HandCoins } from 'lucide-react'
import { createExpense, type CreateExpensePayload } from '@/lib/expense-service'
import { useHouse } from '@/lib/house-context'
import { toast } from 'sonner'

interface SettlementDialogProps {
  settlement: {
    from: string
    fromName: string
    to: string
    toName: string
    amount: number
  }
  onSettled?: () => void
}

export function SettlementDialog({ settlement, onSettled }: SettlementDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(settlement.amount.toFixed(2))
  const [loading, setLoading] = useState(false)
  const { selectedHouse } = useHouse()

  const handleSettle = async () => {
    if (!selectedHouse) return

    try {
      setLoading(true)
      
      const payload: CreateExpensePayload = {
        amount: parseFloat(amount),
        description: `Settlement: ${settlement.fromName} pays ${settlement.toName}`,
        category: 'SETTLEMENT',
        paidById: settlement.from,
        houseId: selectedHouse.id,
        splitWith: [settlement.to], // The receiver is in splitWith for settlement
        date: new Date().toISOString(),
      }

      await createExpense(payload)
      
      toast.success('Settlement recorded successfully!')
      setOpen(false)
      onSettled?.()
    } catch (error) {
      console.error('Failed to record settlement:', error)
      toast.error('Failed to record settlement. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HandCoins className="h-4 w-4" />
          Settle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Settlement</DialogTitle>
          <DialogDescription>
            Record a payment to settle the balance between members
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {settlement.fromName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{settlement.fromName}</p>
                <p className="text-sm text-muted-foreground">Paying</p>
              </div>
            </div>
            
            <div className="text-2xl font-bold">→</div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">{settlement.toName}</p>
                <p className="text-sm text-muted-foreground">Receiving</p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {settlement.toName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Settlement Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            <p className="text-xs text-muted-foreground">
              Suggested amount: ${settlement.amount.toFixed(2)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              💡 How settlements work
            </p>
            <p className="text-blue-700 dark:text-blue-200 text-xs">
              Recording this settlement will update both members&apos; balances. 
              {settlement.fromName} will pay ${amount} to {settlement.toName}.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSettle} disabled={loading}>
            {loading ? 'Recording...' : 'Record Settlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
