'use client'

import { useState, useEffect } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HandCoins } from 'lucide-react'
import { createExpense, type CreateExpensePayload } from '@/lib/expense-service'
import { useHouse } from '@/lib/house-context'
import { toast } from 'sonner'

interface HouseMember {
  id: string
  name: string
  imageUrl: string | null
}

interface ManualSettlementDialogProps {
  onSettled?: () => void
}

export function ManualSettlementDialog({ onSettled }: ManualSettlementDialogProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [fromUser, setFromUser] = useState('')
  const [toUser, setToUser] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState<HouseMember[]>([])
  const { selectedHouse } = useHouse()

  useEffect(() => {
    if (open && selectedHouse) {
      // Fetch house members
      fetchMembers()
    }
  }, [open, selectedHouse])

  const fetchMembers = async () => {
    if (!selectedHouse) return
    
    try {
      // Get members from the selected house
      const response = await fetch(`/api/houses/${selectedHouse.id}/members`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }

  const handleSettle = async () => {
    if (!selectedHouse || !fromUser || !toUser || !amount) {
      toast.error('Please fill in all required fields')
      return
    }

    if (fromUser === toUser) {
      toast.error('Cannot settle with yourself')
      return
    }

    try {
      setLoading(true)
      
      const fromMember = members.find(m => m.id === fromUser)
      const toMember = members.find(m => m.id === toUser)
      
      const payload: CreateExpensePayload = {
        amount: parseFloat(amount),
        description: description || `Settlement: ${fromMember?.name} pays ${toMember?.name}`,
        category: 'SETTLEMENT',
        paidById: fromUser,
        houseId: selectedHouse.id,
        splitWith: [toUser], // The receiver is in splitWith for settlement
        date: new Date().toISOString(),
      }

      await createExpense(payload)
      
      toast.success('Settlement recorded successfully!')
      setOpen(false)
      setAmount('')
      setFromUser('')
      setToUser('')
      setDescription('')
      onSettled?.()
    } catch (error) {
      console.error('Failed to record settlement:', error)
      toast.error('Failed to record settlement. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedFromMember = members.find(m => m.id === fromUser)
  const selectedToMember = members.find(m => m.id === toUser)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <HandCoins className="h-4 w-4" />
          Record Settlement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record Manual Settlement</DialogTitle>
          <DialogDescription>
            Record a payment between house members to settle balances
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">From (Payer)</Label>
              <Select value={fromUser} onValueChange={setFromUser}>
                <SelectTrigger id="from">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.imageUrl || undefined} />
                          <AvatarFallback>
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to">To (Receiver)</Label>
              <Select value={toUser} onValueChange={setToUser}>
                <SelectTrigger id="to">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={member.imageUrl || undefined} />
                          <AvatarFallback>
                            {member.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {member.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFromMember && selectedToMember && (
            <div className="flex items-center justify-center gap-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedFromMember.imageUrl || undefined} />
                  <AvatarFallback>
                    {selectedFromMember.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedFromMember.name}</span>
              </div>
              <div className="text-xl">→</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedToMember.name}</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedToMember.imageUrl || undefined} />
                  <AvatarFallback>
                    {selectedToMember.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Rent payment, Groceries reimbursement"
            />
          </div>

          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
            <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              💡 Settlement Info
            </p>
            <p className="text-blue-700 dark:text-blue-200 text-xs">
              This will be recorded as a payment from {selectedFromMember?.name || 'the payer'} to {selectedToMember?.name || 'the receiver'}, 
              adjusting both members&apos; balances accordingly.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSettle} 
            disabled={loading || !fromUser || !toUser || !amount}
          >
            {loading ? 'Recording...' : 'Record Settlement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
