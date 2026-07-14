"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLedger } from "@/lib/actions/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SerializedLedgerGroup } from "@/lib/serialize";

export function LedgerForm({
  groups,
  trigger,
  onSuccess,
  reloadOnSuccess = true,
}: {
  groups: SerializedLedgerGroup[];
  trigger?: React.ReactNode;
  onSuccess?: (ledgerId: string) => void | Promise<void>;
  reloadOnSuccess?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [groupId, setGroupId] = useState("");
  const [openingBalance, setOpeningBalance] = useState("0");
  const [openingType, setOpeningType] = useState<"Dr" | "Cr">("Dr");

  function resetFields() {
    setName("");
    setGroupId("");
    setOpeningBalance("0");
    setOpeningType("Dr");
    setError(null);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("groupId", groupId);
    formData.set("openingBalance", openingBalance);
    formData.set("openingType", openingType);

    try {
      const result = await createLedger(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setOpen(false);
      resetFields();
      setLoading(false);

      if (result.ledgerId) {
        await onSuccess?.(result.ledgerId);
      }

      if (reloadOnSuccess) {
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetFields();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? <Button type="button">Create Ledger</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Ledger</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ledger-name">Ledger Name *</Label>
            <Input
              id="ledger-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="groupId">Under Group *</Label>
            <Select
              id="groupId"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              required
            >
              <option value="" disabled>
                Select group
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openingBalance">Opening Balance</Label>
              <Input
                id="openingBalance"
                type="number"
                step="0.01"
                min="0"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="openingType">Balance Type</Label>
              <Select
                id="openingType"
                value={openingType}
                onChange={(e) => setOpeningType(e.target.value as "Dr" | "Cr")}
              >
                <option value="Dr">Debit (Dr)</option>
                <option value="Cr">Credit (Cr)</option>
              </Select>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" onClick={handleSave} disabled={loading || !name || !groupId}>
              {loading ? "Saving..." : "Save Ledger"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
