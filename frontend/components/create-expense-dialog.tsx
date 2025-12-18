"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import { createExpense } from "@/lib/expense-service";
import type { Expense, User, ExpenseSplit } from "@/lib/types";
import { apiGet } from "@/lib/api-client";
import { Checkbox } from "@/components/ui/checkbox";
import { useHouse } from "@/lib/house-context";

interface CreateExpenseDialogProps {
  onExpenseCreated?: (expense: Expense) => void;
  houseId?: string;
}

export function CreateExpenseDialog({
  onExpenseCreated,
  houseId,
}: CreateExpenseDialogProps) {
  const { selectedHouse } = useHouse();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    houseId: houseId || "",
    category: "",
    paidBy: "",
    splitWith: [] as string[],
    date: new Date().toISOString().split("T")[0],
  });
  const [splitPercentages, setSplitPercentages] = useState<
    Record<string, number>
  >({});

  const [formErrors, setFormErrors] = useState({
    amount: false,
    description: false,
    category: false,
    paidBy: false,
    splitWith: false,
    houseId: false,
    splitPercentages: false,
  });

  const categories = [
    { value: "GROCERIES", label: "Groceries" },
    { value: "UTILITIES", label: "Utilities" },
    { value: "HOUSEHOLD", label: "Household" },
    { value: "FOOD", label: "Food" },
    { value: "ENTERTAINMENT", label: "Entertainment" },
    { value: "TRANSPORTATION", label: "Transportation" },
    { value: "OTHER", label: "Other" },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (formErrors.category) {
      setFormErrors((prev) => ({ ...prev, category: false }));
    }
  };

  const handlePaidByChange = (value: string) => {
    setFormData((prev) => {
      // Auto-add payer to splitWith if not already included
      const splitWith = prev.splitWith.includes(value)
        ? prev.splitWith
        : [...prev.splitWith, value];

      // Recalculate equal percentages when payer changes
      const equalPercentage = splitWith.length > 0 ? 100 / splitWith.length : 0;
      const newPercentages: Record<string, number> = {};
      splitWith.forEach((id) => {
        newPercentages[id] = equalPercentage;
      });
      setSplitPercentages(newPercentages);

      return { ...prev, paidBy: value, splitWith };
    });
    if (formErrors.paidBy) {
      setFormErrors((prev) => ({ ...prev, paidBy: false }));
    }
  };

  const handleSplitWithToggle = (userId: string) => {
    // Prevent unchecking the payer
    if (userId === formData.paidBy) {
      return;
    }
    setFormData((prev) => {
      const splitWith = prev.splitWith.includes(userId)
        ? prev.splitWith.filter((id) => id !== userId)
        : [...prev.splitWith, userId];

      // Recalculate equal percentages when members change
      const equalPercentage = splitWith.length > 0 ? 100 / splitWith.length : 0;
      const newPercentages: Record<string, number> = {};
      splitWith.forEach((id) => {
        newPercentages[id] = equalPercentage;
      });
      setSplitPercentages(newPercentages);

      return { ...prev, splitWith };
    });
    if (formErrors.splitWith) {
      setFormErrors((prev) => ({ ...prev, splitWith: false }));
    }
  };

  const handlePercentageChange = (userId: string, value: string) => {
    const percentage = parseFloat(value) || 0;
    setSplitPercentages((prev) => ({
      ...prev,
      [userId]: percentage,
    }));
    if (formErrors.splitPercentages) {
      setFormErrors((prev) => ({ ...prev, splitPercentages: false }));
    }
  };

  const getTotalPercentage = () => {
    return Object.values(splitPercentages).reduce((sum, val) => sum + val, 0);
  };

  const validateForm = () => {
    const totalPercentage = getTotalPercentage();
    const errors = {
      amount: !formData.amount || parseFloat(formData.amount) <= 0,
      description: !formData.description.trim(),
      category: !formData.category,
      paidBy: !formData.paidBy,
      splitWith: formData.splitWith.length === 0,
      houseId: false,
      splitPercentages: Math.abs(totalPercentage - 100) > 0.01,
    };

    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  // Load users from selected house when dialog opens
  useEffect(() => {
    if (open && selectedHouse) {
      loadHouseUsers();
    }
  }, [open, selectedHouse]);

  const loadHouseUsers = async () => {
    if (!selectedHouse) {
      setError("Please select a house first.");
      setUsers([]);
      return;
    }

    try {
      const response = await apiGet<User[]>(
        `/house/${selectedHouse.id}/users`,
        { requiresAuth: true },
      );
      setUsers(response);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users from this house.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!validateForm()) {
      setError("Please fill in all required fields correctly.");
      return;
    }

    if (!selectedHouse) {
      setError("Please select a house first.");
      return;
    }

    setIsLoading(true);

    try {
      // Create the expense via API
      // For today's date, use current time; for past dates, use noon to avoid timezone issues
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      let expenseDate: Date;
      if (selectedDate.getTime() === today.getTime()) {
        // Use current timestamp for today
        expenseDate = new Date();
      } else {
        // Use noon for past dates to avoid timezone edge cases
        expenseDate = new Date(formData.date);
        expenseDate.setHours(12, 0, 0, 0);
      }

      const newExpense = await createExpense({
        amount: parseFloat(formData.amount),
        description: formData.description.trim(),
        category: formData.category,
        paidById: formData.paidBy,
        houseId: selectedHouse.id,
        splitWith: formData.splitWith,
        splits: formData.splitWith.map((userId) => ({
          userId,
          percentage: splitPercentages[userId] || 0,
        })),
        date: expenseDate.toISOString(),
      });

      // Call the callback with the new expense
      onExpenseCreated?.(newExpense);

      // Reset form and close dialog
      setFormData({
        amount: "",
        description: "",
        houseId: houseId || "",
        category: "",
        paidBy: "",
        splitWith: [],
        date: new Date().toISOString().split("T")[0],
      });
      setSplitPercentages({});
      setFormErrors({
        amount: false,
        description: false,
        category: false,
        paidBy: false,
        splitWith: false,
        houseId: false,
        splitPercentages: false,
      });
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create expense. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when dialog closes
      setFormData({
        amount: "",
        description: "",
        houseId: houseId || "",
        category: "",
        paidBy: "",
        splitWith: [],
        date: new Date().toISOString().split("T")[0],
      });
      setSplitPercentages({});
      setFormErrors({
        amount: false,
        description: false,
        category: false,
        paidBy: false,
        splitWith: false,
        houseId: false,
        splitPercentages: false,
      });
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record New Expense</DialogTitle>
            <DialogDescription>
              Add a new expense to track household spending. All fields marked
              with * are required.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount (€) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="45.50"
                value={formData.amount}
                onChange={handleChange}
                aria-invalid={formErrors.amount}
                className={formErrors.amount ? "border-destructive" : ""}
              />
              {formErrors.amount && (
                <p className="text-sm text-destructive">
                  Amount must be greater than 0
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Groceries - Weekly Shopping"
                value={formData.description}
                onChange={handleChange}
                aria-invalid={formErrors.description}
                className={formErrors.description ? "border-destructive" : ""}
                maxLength={255}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">
                  Description is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="house">
                House <span className="text-destructive">*</span>
              </Label>
              <Input
                id="house"
                value={selectedHouse?.name || "No house selected"}
                disabled
                className="bg-muted"
              />
              {!selectedHouse && (
                <p className="text-sm text-muted-foreground">
                  Please select a house from the header to create expenses
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger
                  id="category"
                  aria-invalid={formErrors.category}
                  className={formErrors.category ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.category && (
                <p className="text-sm text-destructive">Category is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidBy">
                Paid By <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.paidBy}
                onValueChange={handlePaidByChange}
              >
                <SelectTrigger
                  id="paidBy"
                  aria-invalid={formErrors.paidBy}
                  className={formErrors.paidBy ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select payer" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.paidBy && (
                <p className="text-sm text-destructive">Payer is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Split With <span className="text-destructive">*</span>
              </Label>
              <div className="border rounded-md p-3 space-y-3 max-h-[200px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-2 gap-2"
                  >
                    <Checkbox
                      id={`split-${user.id}`}
                      checked={formData.splitWith.includes(user.id)}
                      onCheckedChange={() => handleSplitWithToggle(user.id)}
                    />
                    <label
                      htmlFor={`split-${user.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {user.name || user.username}
                    </label>
                    {formData.splitWith.includes(user.id) && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={splitPercentages[user.id] || ""}
                          onChange={(e) =>
                            handlePercentageChange(user.id, e.target.value)
                          }
                          className="w-20 h-8 text-sm"
                          placeholder="0"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {formData.splitWith.length > 0 && (
                <div className="flex justify-between items-center text-sm mt-2 px-3">
                  <span className="font-medium">Total:</span>
                  <span
                    className={`font-bold ${
                      Math.abs(getTotalPercentage() - 100) > 0.01
                        ? "text-destructive"
                        : "text-green-600"
                    }`}
                  >
                    {getTotalPercentage().toFixed(2)}%
                  </span>
                </div>
              )}
              {formErrors.splitWith && (
                <p className="text-sm text-destructive">
                  Select at least one person to split with
                </p>
              )}
              {formErrors.splitPercentages && (
                <p className="text-sm text-destructive">
                  Split percentages must sum to 100%
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
