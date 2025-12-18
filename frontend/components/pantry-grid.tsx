"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { PantryItem } from "@/lib/types";
import { format } from "date-fns";
import { AlertCircle, Minus, Plus, MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input as TextInput } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Button as UiButton } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiPatch, apiDelete } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

interface PantryGridProps {
  items?: PantryItem[];
  pantryHouseId?: string | undefined;
  pantryId?: string | undefined;
}

export function PantryGrid({
  items,
  pantryHouseId,
  pantryId,
}: PantryGridProps) {
  const [localItems, setLocalItems] = useState<PantryItem[]>(items ?? []);
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<number | string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogItem, setDialogItem] = useState<PantryItem | null>(null);
  const [formName, setFormName] = useState<string>("");
  const [formUnit, setFormUnit] = useState<string>("UNITS");
  const [formCategory, setFormCategory] = useState<string>("OTHER");
  const [formQuantity, setFormQuantity] = useState<number | string>(0);
  const [formExpiry, setFormExpiry] = useState<string>("");

  const [zeroConfirmOpen, setZeroConfirmOpen] = useState(false);
  const [zeroConfirmAction, setZeroConfirmAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [zeroConfirmMessage, setZeroConfirmMessage] = useState<string>("");

  // Only update localItems when items change significantly (different length or IDs)
  useEffect(() => {
    const itemIds = (items ?? [])
      .map((i) => i.id)
      .sort()
      .join(",");
    const localIds = localItems
      .map((i) => i.id)
      .sort()
      .join(",");

    // Only reset if items were added/removed, not if quantities changed
    if (itemIds !== localIds) {
      setLocalItems(items ?? []);
    }
  }, [items]);

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Pantry Items</h2>
      {localItems.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 p-6 text-center text-gray-600">
          <p className="mb-2">No pantry items found.</p>
          <p className="text-sm">
            You can add items using the "Add item" form.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {localItems.map((item) => {
            const now = new Date();
            const daysUntilExpiry = item.expiryDate
              ? Math.ceil(
                  (item.expiryDate.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24),
                )
              : undefined;

            // expiry state: expired, urgent (<=3d), soon (<=7d), later
            const expiryState =
              daysUntilExpiry === undefined
                ? "none"
                : daysUntilExpiry < 0
                  ? "expired"
                  : daysUntilExpiry <= 3
                    ? "urgent"
                    : daysUntilExpiry <= 7
                      ? "soon"
                      : "later";

            return (
              <Card
                key={item.id}
                className="p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.lowStock && (
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    )}
                    <button
                      className="p-1 rounded hover:bg-gray-100"
                      aria-label="Edit item"
                      onClick={() => {
                        setDialogItem(item);
                        setFormName(item.name ?? "");
                        setFormUnit(item.unit ?? "UNITS");
                        setFormCategory(item.category ?? "OTHER");
                        setFormQuantity(item.quantity ?? 0);
                        setFormExpiry(
                          item.expiryDate
                            ? (item.expiryDate as Date)
                                .toISOString()
                                .slice(0, 10)
                            : "",
                        );
                        setDialogOpen(true);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={async () => {
                          if (!pantryHouseId || !pantryId) {
                            toast({
                              title: "Pantry not available",
                              description:
                                "Cannot update quantity: pantry id missing.",
                            });
                            return;
                          }
                          const originalQty = item.quantity;
                          // step logic: >100 -> 10, >=20 -> 5, <20 -> 1
                          const step =
                            originalQty > 100 ? 10 : originalQty >= 20 ? 5 : 1;
                          const newQty = Math.max(0, originalQty - step);
                          if (newQty === 0) {
                            // confirm removal instead of immediately setting to zero
                            setZeroConfirmMessage(
                              `Do you want to remove "${item.name}" from the pantry?`,
                            );
                            setZeroConfirmAction(() => async () => {
                              try {
                                await apiPatch(
                                  `/pantry/${pantryHouseId}/${pantryId}`,
                                  { items: [{ itemId: item.id, quantity: 0 }] },
                                  { requiresAuth: true },
                                );
                                toast({
                                  title: "Removed",
                                  description: "Item removed from pantry.",
                                });
                                setLocalItems((prev) =>
                                  prev.filter((it) => it.id !== item.id),
                                );
                                window.location.reload();
                              } catch (err) {
                                toast({
                                  title: "Remove failed",
                                  description: String(err),
                                });
                                // keep original quantity
                                setLocalItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? {
                                          ...it,
                                          quantity: originalQty,
                                          lowStock: Number(originalQty) <= 1,
                                        }
                                      : it,
                                  ),
                                );
                              }
                            });
                            setZeroConfirmOpen(true);
                            return;
                          }

                          // optimistic update (also recalc lowStock)
                          setLocalItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id
                                ? {
                                    ...it,
                                    quantity: newQty,
                                    lowStock: Number(newQty) <= 1,
                                  }
                                : it,
                            ),
                          );
                          try {
                            await apiPatch(
                              `/pantry/${pantryHouseId}/${pantryId}`,
                              {
                                items: [{ itemId: item.id, quantity: newQty }],
                              },
                              { requiresAuth: true },
                            );
                            toast({
                              title: "Quantity updated",
                              description: "Item quantity decreased.",
                            });
                          } catch (err) {
                            // revert (restore lowStock based on original quantity)
                            setLocalItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? {
                                      ...it,
                                      quantity: originalQty,
                                      lowStock: Number(originalQty) <= 1,
                                    }
                                  : it,
                              ),
                            );
                            toast({
                              title: "Update failed",
                              description: String(err),
                            });
                          }
                        }}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      <span className="font-medium text-gray-900">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <TextInput
                              type="number"
                              value={String(editingValue)}
                              onChange={(e) =>
                                setEditingValue(
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                                )
                              }
                              className="w-28 h-8"
                              step={
                                item.unit?.toLowerCase().includes("g")
                                  ? "1"
                                  : "1"
                              }
                            />
                            <UiButton
                              size="sm"
                              onClick={async () => {
                                const parsed = Number(editingValue);
                                if (Number.isNaN(parsed) || parsed < 0) {
                                  toast({
                                    title: "Invalid quantity",
                                    description:
                                      "Please enter a valid non-negative number.",
                                  });
                                  return;
                                }
                                const originalQty = item.quantity;
                                // If parsed is zero, ask for confirmation instead of immediately saving
                                if (parsed === 0) {
                                  setZeroConfirmMessage(
                                    `Do you want to remove "${item.name}" from the pantry?`,
                                  );
                                  setZeroConfirmAction(() => async () => {
                                    try {
                                      if (!pantryHouseId || !pantryId)
                                        throw new Error("pantry id missing");
                                      await apiPatch(
                                        `/pantry/${pantryHouseId}/${pantryId}`,
                                        {
                                          items: [
                                            { itemId: item.id, quantity: 0 },
                                          ],
                                        },
                                        { requiresAuth: true },
                                      );
                                      toast({
                                        title: "Removed",
                                        description:
                                          "Item removed from pantry.",
                                      });
                                      setLocalItems((prev) =>
                                        prev.filter((it) => it.id !== item.id),
                                      );
                                      window.location.reload();
                                    } catch (err) {
                                      toast({
                                        title: "Remove failed",
                                        description: String(err),
                                      });
                                      // revert
                                      setLocalItems((prev) =>
                                        prev.map((it) =>
                                          it.id === item.id
                                            ? {
                                                ...it,
                                                quantity: originalQty,
                                                lowStock:
                                                  Number(originalQty) <= 1,
                                              }
                                            : it,
                                        ),
                                      );
                                    } finally {
                                      setEditingId(null);
                                      setEditingValue("");
                                    }
                                  });
                                  setZeroConfirmOpen(true);
                                  return;
                                }

                                setLocalItems((prev) =>
                                  prev.map((it) =>
                                    it.id === item.id
                                      ? {
                                          ...it,
                                          quantity: parsed,
                                          lowStock: Number(parsed) <= 1,
                                        }
                                      : it,
                                  ),
                                );
                                setEditingId(null);
                                try {
                                  if (!pantryHouseId || !pantryId)
                                    throw new Error("pantry id missing");
                                  await apiPatch(
                                    `/pantry/${pantryHouseId}/${pantryId}`,
                                    {
                                      items: [
                                        { itemId: item.id, quantity: parsed },
                                      ],
                                    },
                                    { requiresAuth: true },
                                  );
                                  toast({
                                    title: "Quantity updated",
                                    description: "Item quantity saved.",
                                  });
                                } catch (err) {
                                  // revert
                                  setLocalItems((prev) =>
                                    prev.map((it) =>
                                      it.id === item.id
                                        ? {
                                            ...it,
                                            quantity: originalQty,
                                            lowStock: Number(originalQty) <= 1,
                                          }
                                        : it,
                                    ),
                                  );
                                  toast({
                                    title: "Update failed",
                                    description: String(err),
                                  });
                                }
                              }}
                            >
                              Save
                            </UiButton>
                            <UiButton
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(null);
                                setEditingValue("");
                              }}
                            >
                              Cancel
                            </UiButton>
                          </div>
                        ) : (
                          <button
                            className="text-gray-900"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingValue(item.quantity);
                            }}
                          >
                            {item.quantity} {item.unit}
                          </button>
                        )}
                      </span>
                      {/* moved edit button to top-right */}

                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-7 h-7 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={async () => {
                          if (!pantryHouseId || !pantryId) {
                            toast({
                              title: "Pantry not available",
                              description:
                                "Cannot update quantity: pantry id missing.",
                            });
                            return;
                          }
                          const originalQty = item.quantity;
                          // step logic: >100 -> 10, >=20 -> 5, <20 -> 1
                          const step =
                            originalQty > 100 ? 10 : originalQty >= 20 ? 5 : 1;
                          const newQty = originalQty + step;
                          setLocalItems((prev) =>
                            prev.map((it) =>
                              it.id === item.id
                                ? {
                                    ...it,
                                    quantity: newQty,
                                    lowStock: Number(newQty) <= 1,
                                  }
                                : it,
                            ),
                          );
                          try {
                            await apiPatch(
                              `/pantry/${pantryHouseId}/${pantryId}`,
                              {
                                items: [{ itemId: item.id, quantity: newQty }],
                              },
                              { requiresAuth: true },
                            );
                            toast({
                              title: "Quantity updated",
                              description: "Item quantity increased.",
                            });
                          } catch (err) {
                            // revert
                            setLocalItems((prev) =>
                              prev.map((it) =>
                                it.id === item.id
                                  ? {
                                      ...it,
                                      quantity: originalQty,
                                      lowStock: Number(originalQty) <= 1,
                                    }
                                  : it,
                              ),
                            );
                            toast({
                              title: "Update failed",
                              description: String(err),
                            });
                          }
                        }}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {item.expiryDate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Expires:</span>
                      <span
                        className={`font-medium ${expiryState === "expired" || expiryState === "urgent" ? "text-red-600" : expiryState === "soon" ? "text-orange-600" : "text-gray-900"}`}
                      >
                        {expiryState === "expired"
                          ? `Expired - ${Math.abs(daysUntilExpiry ?? 0)} day${Math.abs(daysUntilExpiry ?? 0) !== 1 ? "s" : ""} ago`
                          : expiryState === "urgent"
                            ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} - use soon`
                            : expiryState === "soon"
                              ? `Nearly due - ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? "s" : ""} left`
                              : `Expires on ${format(item.expiryDate, "MMM d, yyyy")}`}
                      </span>
                    </div>
                  )}

                  {item.lowStock && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      <AlertCircle className="w-3 h-3" />
                      <span>
                        {item.quantity <= 1
                          ? `Only ${item.quantity} left — restock soon`
                          : `Low stock — ${item.quantity} left`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={item.addedByAvatar} />
                    <AvatarFallback className="text-xs">
                      {(item.addedBy && item.addedBy.trim()
                        ? item.addedBy
                            .trim()
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"
                      ).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-gray-500">
                    Added by {item.addedBy ?? "Unknown"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit / remove dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            setDialogItem(null);
          } else setDialogOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit pantry item</DialogTitle>
            <DialogDescription>
              Change fields and save. You can also remove this item from the
              pantry.
            </DialogDescription>
          </DialogHeader>

          {dialogItem && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <TextInput
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div>
                <Label>Quantity</Label>
                <TextInput
                  type="number"
                  value={String(formQuantity)}
                  onChange={(e) =>
                    setFormQuantity(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Unit</Label>
                  <Select
                    value={formUnit}
                    onValueChange={(v) => setFormUnit(v)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNITS">unit</SelectItem>
                      <SelectItem value="G">g</SelectItem>
                      <SelectItem value="KG">kg</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="ML">ml</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formCategory}
                    onValueChange={(v) => setFormCategory(v)}
                  >
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OTHER">Pantry / Other</SelectItem>
                      <SelectItem value="GRAINS">Grains</SelectItem>
                      <SelectItem value="DAIRY">Dairy</SelectItem>
                      <SelectItem value="VEGETABLES">Vegetables</SelectItem>
                      <SelectItem value="FRUITS">Fruits</SelectItem>
                      <SelectItem value="MEAT">Meat</SelectItem>
                      <SelectItem value="FROZEN">Frozen</SelectItem>
                      <SelectItem value="CONDIMENTS">
                        Household / Condiments
                      </SelectItem>
                      <SelectItem value="BEVERAGES">Beverages</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Expiry date</Label>
                <TextInput
                  type="date"
                  value={formExpiry}
                  onChange={(e) => setFormExpiry(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                <UiButton
                  variant="destructive"
                  onClick={async () => {
                    if (!dialogItem) return;
                    // Try to delete catalog item (this will cascade-delete pantry associations per DB schema)
                    try {
                      await apiDelete(`/pantry-item/${dialogItem.id}`, {
                        requiresAuth: true,
                      });
                      toast({
                        title: "Deleted",
                        description:
                          "Item removed from catalog and all pantries.",
                      });
                      setLocalItems((prev) =>
                        prev.filter((it) => it.id !== dialogItem.id),
                      );
                      setDialogOpen(false);
                      window.location.reload();
                      return;
                    } catch (err: any) {
                      // If delete is forbidden (not creator) or not found, attempt to at least remove from this pantry
                      const status =
                        err?.status ?? (err?.originalError as any)?.status;
                      if (status === 403 || status === 404) {
                        // try removing only the pantry association
                        if (!pantryHouseId || !pantryId) {
                          toast({
                            title: "Pantry missing",
                            description:
                              "Cannot remove item - pantry id missing.",
                          });
                          return;
                        }
                        try {
                          await apiPatch(
                            `/pantry/${pantryHouseId}/${pantryId}`,
                            { items: [{ itemId: dialogItem.id, quantity: 0 }] },
                            { requiresAuth: true },
                          );
                          toast({
                            title: "Partially removed",
                            description:
                              "Item removed from this pantry (catalog not deleted: insufficient permissions).",
                          });
                          setLocalItems((prev) =>
                            prev.filter((it) => it.id !== dialogItem.id),
                          );
                          setDialogOpen(false);
                          window.location.reload();
                          return;
                        } catch (err2) {
                          toast({
                            title: "Remove failed",
                            description: String(err2),
                          });
                          return;
                        }
                      }

                      // Unknown error, show it
                      toast({
                        title: "Delete failed",
                        description: String(err),
                      });
                    }
                  }}
                >
                  Delete
                </UiButton>
              </div>
              <div className="flex gap-2">
                <UiButton
                  variant="ghost"
                  onClick={() => {
                    setDialogOpen(false);
                    setDialogItem(null);
                  }}
                >
                  Cancel
                </UiButton>
                <UiButton
                  onClick={async () => {
                    if (!dialogItem) return;
                    // Save changes: update pantry-item fields and pantry fields (quantity/expiry)
                    try {
                      // update catalog item
                      await apiPatch(
                        `/pantry-item/${dialogItem.id}`,
                        {
                          name: formName,
                          measurementUnit: formUnit,
                          category: formCategory,
                        },
                        { requiresAuth: true },
                      );
                    } catch (err) {
                      // non-fatal; show a warning
                      toast({
                        title: "Catalog update failed",
                        description: String(err),
                      });
                    }
                    try {
                      if (pantryHouseId && pantryId) {
                        const qty = Number(formQuantity);
                        // if qty is zero, ask for confirmation before removing
                        if (qty === 0) {
                          setZeroConfirmMessage(
                            `Do you want to remove "${dialogItem.name}" from the pantry?`,
                          );
                          setZeroConfirmAction(() => async () => {
                            try {
                              // ensure catalog update attempted
                              try {
                                await apiPatch(
                                  `/pantry-item/${dialogItem.id}`,
                                  {
                                    name: formName,
                                    measurementUnit: formUnit,
                                    category: formCategory,
                                  },
                                  { requiresAuth: true },
                                );
                              } catch (e) {
                                // ignore catalog update errors here
                              }
                              await apiPatch(
                                `/pantry/${pantryHouseId}/${pantryId}`,
                                {
                                  items: [
                                    {
                                      itemId: dialogItem.id,
                                      quantity: 0,
                                      expiryDate: formExpiry || undefined,
                                    },
                                  ],
                                },
                                { requiresAuth: true },
                              );
                              toast({
                                title: "Removed",
                                description: "Item removed from pantry.",
                              });
                              setLocalItems((prev) =>
                                prev.filter((it) => it.id !== dialogItem.id),
                              );
                              // close edit dialog as the item is removed
                              setDialogOpen(false);
                              setDialogItem(null);
                              window.location.reload();
                            } catch (err) {
                              toast({
                                title: "Remove failed",
                                description: String(err),
                              });
                            }
                          });
                          setZeroConfirmOpen(true);
                          return;
                        }

                        await apiPatch(
                          `/pantry/${pantryHouseId}/${pantryId}`,
                          {
                            items: [
                              {
                                itemId: dialogItem.id,
                                quantity: qty,
                                expiryDate: formExpiry || undefined,
                              },
                            ],
                          },
                          { requiresAuth: true },
                        );
                        toast({
                          title: "Saved",
                          description: "Item updated in pantry.",
                        });
                        // refresh local item (recalc lowStock)
                        setLocalItems((prev) =>
                          prev.map((it) =>
                            it.id === dialogItem.id
                              ? {
                                  ...it,
                                  name: formName,
                                  category: formCategory,
                                  unit: formUnit,
                                  quantity: Number(formQuantity),
                                  expiryDate: formExpiry
                                    ? new Date(formExpiry)
                                    : undefined,
                                  lowStock: Number(formQuantity) <= 1,
                                }
                              : it,
                          ),
                        );
                        window.location.reload();
                      }
                    } catch (err) {
                      toast({ title: "Save failed", description: String(err) });
                    }
                    setDialogOpen(false);
                    setDialogItem(null);
                  }}
                >
                  Save
                </UiButton>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm zero-quantity removal dialog */}
      <Dialog
        open={zeroConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setZeroConfirmOpen(false);
            setZeroConfirmAction(null);
          } else setZeroConfirmOpen(true);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove item</DialogTitle>
            <DialogDescription>
              {zeroConfirmMessage ||
                "Do you want to remove this item from the pantry?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex gap-2 w-full justify-end">
              <UiButton
                variant="ghost"
                onClick={() => {
                  setZeroConfirmOpen(false);
                  setZeroConfirmAction(null);
                }}
              >
                Cancel
              </UiButton>
              <UiButton
                variant="destructive"
                onClick={async () => {
                  if (zeroConfirmAction) {
                    const action = zeroConfirmAction;
                    setZeroConfirmAction(null);
                    await action();
                  }
                  setZeroConfirmOpen(false);
                }}
              >
                Remove
              </UiButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
