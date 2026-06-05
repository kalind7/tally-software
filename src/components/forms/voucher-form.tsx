"use client";

import { useCallback, useEffect, useState } from "react";
import { createVoucher, getNextNumber } from "@/lib/actions/voucher";
import { LedgerForm } from "@/components/forms/ledger-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { LedgerGroup, VoucherType } from "@prisma/client";
import type { SerializedLedgerWithGroup } from "@/lib/serialize";

type LineState = {
  ledgerId: string;
  dr: string;
  cr: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  showBill: boolean;
};

const VOUCHER_TYPES: VoucherType[] = [
  "Payment",
  "Receipt",
  "Contra",
  "Journal",
  "Sales",
  "Purchase",
];

const emptyLine = (): LineState => ({
  ledgerId: "",
  dr: "",
  cr: "",
  billNo: "",
  billDate: "",
  dueDate: "",
  showBill: false,
});

export function VoucherForm({
  ledgers: initialLedgers,
  groups,
}: {
  ledgers: SerializedLedgerWithGroup[];
  groups: LedgerGroup[];
}) {
  const [ledgers, setLedgers] = useState(initialLedgers);
  const [type, setType] = useState<VoucherType>("Journal");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [number, setNumber] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<LineState[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshNumber = useCallback(async () => {
    const n = await getNextNumber(type, date);
    setNumber(n);
  }, [type, date]);

  useEffect(() => {
    refreshNumber();
  }, [refreshNumber]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        document.getElementById("inline-ledger-trigger")?.click();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const totalDr = lines.reduce((s, l) => s + (parseFloat(l.dr) || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (parseFloat(l.cr) || 0), 0);
  const difference = Math.abs(totalDr - totalCr);

  function updateLine(index: number, patch: Partial<LineState>) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, ...patch } : line))
    );
  }

  function handleDrChange(index: number, value: string) {
    updateLine(index, { dr: value, cr: value ? "" : lines[index].cr });
  }

  function handleCrChange(index: number, value: string) {
    updateLine(index, { cr: value, dr: value ? "" : lines[index].dr });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = lines
      .filter((l) => l.ledgerId && (l.dr || l.cr))
      .map((l) => ({
        ledgerId: l.ledgerId,
        amount: parseFloat(l.dr || l.cr),
        entryType: (l.dr ? "Dr" : "Cr") as "Dr" | "Cr",
        billNo: l.billNo || undefined,
        billDate: l.billDate || undefined,
        dueDate: l.dueDate || undefined,
        refType: "New" as const,
      }));

    const result = await createVoucher({
      type,
      date,
      narration,
      lines: payload,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    window.location.href = `/transactions/vouchers/${result.voucherId}`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Voucher Type</Label>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as VoucherType)}
          >
            {VOUCHER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Voucher No.</Label>
          <Input value={number} readOnly className="bg-muted" />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end">
          <LedgerForm
            groups={groups}
            trigger={
              <Button type="button" variant="outline" id="inline-ledger-trigger">
                Alt+C Create Ledger
              </Button>
            }
            onSuccess={() => window.location.reload()}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Narration</Label>
        <Textarea
          value={narration}
          onChange={(e) => setNarration(e.target.value)}
          rows={2}
          placeholder="Optional description"
        />
      </div>

      <div className="rounded-xl border">
        <div className="grid grid-cols-12 gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
          <div className="col-span-4">Ledger</div>
          <div className="col-span-2 text-right">Debit (Dr)</div>
          <div className="col-span-2 text-right">Credit (Cr)</div>
          <div className="col-span-4">Bill Details</div>
        </div>
        {lines.map((line, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 border-b px-3 py-2">
            <div className="col-span-4">
              <Select
                value={line.ledgerId}
                onChange={(e) => updateLine(index, { ledgerId: e.target.value })}
              >
                <option value="">Select ledger</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                className="text-right"
                value={line.dr}
                onChange={(e) => handleDrChange(index, e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                className="text-right"
                value={line.cr}
                onChange={(e) => handleCrChange(index, e.target.value)}
              />
            </div>
            <div className="col-span-4 space-y-1">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() =>
                  updateLine(index, { showBill: !line.showBill })
                }
              >
                {line.showBill ? "Hide bill" : "+ Bill wise"}
              </Button>
              {line.showBill && (
                <div className="grid grid-cols-3 gap-1">
                  <Input
                    placeholder="Bill No."
                    value={line.billNo}
                    onChange={(e) =>
                      updateLine(index, { billNo: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    value={line.billDate}
                    onChange={(e) =>
                      updateLine(index, { billDate: e.target.value })
                    }
                  />
                  <Input
                    type="date"
                    value={line.dueDate}
                    onChange={(e) =>
                      updateLine(index, { dueDate: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
        >
          Add Line
        </Button>
        <div className="text-sm">
          <span className="mr-4">
            Dr Total: <strong>{totalDr.toFixed(2)}</strong>
          </span>
          <span className="mr-4">
            Cr Total: <strong>{totalCr.toFixed(2)}</strong>
          </span>
          <span className={difference > 0.001 ? "text-destructive" : "text-green-600"}>
            Diff: {difference.toFixed(2)}
          </span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={loading || difference > 0.001 || totalDr === 0}
      >
        {loading ? "Saving..." : "Save Voucher"}
      </Button>
    </form>
  );
}
