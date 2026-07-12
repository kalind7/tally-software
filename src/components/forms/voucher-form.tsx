"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { toast } from "sonner";
import {
  createVoucher,
  getNextNumber,
  updateVoucher,
} from "@/lib/actions/voucher";
import { getOpenBills } from "@/lib/actions/bill";
import { getLedgers } from "@/lib/actions/ledger";
import { LedgerForm } from "@/components/forms/ledger-form";
import { VoucherTypePicker } from "@/components/forms/voucher-type-picker";
import { BalanceBar } from "@/components/forms/balance-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getTemplateForType } from "@/lib/accounting/voucher-templates";
import { buildVatLines, splitVatFromTaxable } from "@/lib/accounting/vat";
import { NEPAL_STARTER_LEDGERS } from "@/lib/starter-ledgers";
import type { BillRefType, LedgerGroup, VoucherType } from "@prisma/client";
import type { SerializedLedgerWithGroup } from "@/lib/serialize";

type LineState = {
  ledgerId: string;
  dr: string;
  cr: string;
  refType: BillRefType;
  billNo: string;
  billDate: string;
  dueDate: string;
  againstBillId: string;
  showBill: boolean;
};

type OpenBill = {
  id: string;
  billNo: string;
  billDate: string;
  outstanding: number;
};

type VoucherFormProps = {
  ledgers: SerializedLedgerWithGroup[];
  groups: LedgerGroup[];
  mode?: "create" | "edit";
  voucherId?: string;
  initial?: {
    type: VoucherType;
    date: string;
    number: string;
    narration: string | null;
    lines: {
      ledgerId: string;
      amount: number;
      entryType: "Dr" | "Cr";
      billRef?: {
        refType: BillRefType;
        billNo: string;
        billDate: Date;
        dueDate: Date | null;
        againstBillId: string | null;
      } | null;
    }[];
  };
};

const emptyLine = (): LineState => ({
  ledgerId: "",
  dr: "",
  cr: "",
  refType: "New",
  billNo: "",
  billDate: "",
  dueDate: "",
  againstBillId: "",
  showBill: false,
});

type InitialLine = {
  ledgerId: string;
  amount: number;
  entryType: "Dr" | "Cr";
  billRef?: {
    refType: BillRefType;
    billNo: string;
    billDate: Date;
    dueDate: Date | null;
    againstBillId: string | null;
  } | null;
};

function lineFromInitial(line: InitialLine): LineState {
  const bill = line.billRef;
  return {
    ledgerId: line.ledgerId,
    dr: line.entryType === "Dr" ? String(line.amount) : "",
    cr: line.entryType === "Cr" ? String(line.amount) : "",
    refType: bill?.refType ?? "New",
    billNo: bill?.billNo ?? "",
    billDate: bill?.billDate ? new Date(bill.billDate).toISOString().slice(0, 10) : "",
    dueDate: bill?.dueDate ? new Date(bill.dueDate).toISOString().slice(0, 10) : "",
    againstBillId: bill?.againstBillId ?? "",
    showBill: !!bill,
  };
}

export function VoucherForm({
  ledgers: initialLedgers,
  groups,
  mode = "create",
  voucherId,
  initial,
}: VoucherFormProps) {
  const router = useRouter();
  const [ledgers, setLedgers] = useState(initialLedgers);
  const [type, setType] = useState<VoucherType>(initial?.type ?? "Sales");
  const [date, setDate] = useState(
    initial?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)
  );
  const [number, setNumber] = useState(initial?.number ?? "");
  const [narration, setNarration] = useState(initial?.narration ?? "");
  const [lines, setLines] = useState<LineState[]>(
    initial?.lines?.length
      ? initial.lines.map((l) => lineFromInitial(l))
      : [emptyLine(), emptyLine()]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoVat, setAutoVat] = useState(false);
  const [taxableAmount, setTaxableAmount] = useState("");
  const [openBillsByLedger, setOpenBillsByLedger] = useState<
    Record<string, OpenBill[]>
  >({});

  const ledgerByRole = useMemo(() => {
    const map: Record<string, string> = {};
    for (const starter of NEPAL_STARTER_LEDGERS) {
      const ledger = ledgers.find((l) => l.name === starter.name);
      if (ledger) map[starter.name] = ledger.id;
    }
    return map;
  }, [ledgers]);

  const groupedLedgers = useMemo(() => {
    const groupsMap = new Map<string, SerializedLedgerWithGroup[]>();
    for (const ledger of ledgers) {
      const groupName = ledger.group.name;
      if (!groupsMap.has(groupName)) groupsMap.set(groupName, []);
      groupsMap.get(groupName)!.push(ledger);
    }
    return [...groupsMap.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [ledgers]);

  const refreshNumber = useCallback(async () => {
    if (mode === "edit") return;
    const n = await getNextNumber(type, date);
    setNumber(n);
  }, [type, date, mode]);

  useEffect(() => {
    refreshNumber();
  }, [refreshNumber]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.altKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        document.getElementById("inline-ledger-trigger")?.click();
      }
      if (e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        document.getElementById("save-voucher-btn")?.click();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const totalDr = lines.reduce((s, l) => s + (parseFloat(l.dr) || 0), 0);
  const totalCr = lines.reduce((s, l) => s + (parseFloat(l.cr) || 0), 0);
  const difference = Math.abs(totalDr - totalCr);
  const isBalanced = difference <= 0.001 && totalDr > 0;

  const vatPreview =
    autoVat && taxableAmount
      ? splitVatFromTaxable(parseFloat(taxableAmount) || 0)
      : null;

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

  function removeLine(index: number) {
    setLines((prev) => {
      if (prev.length <= 2) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }

  async function loadOpenBills(ledgerId: string) {
    if (!ledgerId || openBillsByLedger[ledgerId]) return;
    const bills = await getOpenBills(ledgerId);
    setOpenBillsByLedger((prev) => ({ ...prev, [ledgerId]: bills }));
  }

  async function handleLedgerCreated(ledgerId: string) {
    const updated = await getLedgers();
    setLedgers(updated);
    setLines((prev) => {
      const next = [...prev];
      const emptyIndex = next.findIndex((line) => !line.ledgerId);
      if (emptyIndex >= 0) {
        next[emptyIndex] = { ...next[emptyIndex], ledgerId };
      }
      return next;
    });
  }

  function applyVatLines() {
    const taxable = parseFloat(taxableAmount);
    if (!taxable || taxable <= 0) return;

    const mode = type === "Sales" ? "sales" : "purchase";
    const specs = buildVatLines(taxable, mode);

    const roleToLedgerId: Record<string, string | undefined> = {
      party: ledgerByRole["Cash"],
      sales: ledgerByRole["Sales"],
      purchase: ledgerByRole["Purchase"],
      vatPayable: ledgerByRole["VAT Payable"],
      vatRecoverable: ledgerByRole["VAT Recoverable"],
    };

    const newLines: LineState[] = specs.map((spec) => ({
      ...emptyLine(),
      ledgerId: roleToLedgerId[spec.ledgerRole] ?? "",
      dr: spec.entryType === "Dr" ? String(spec.amount) : "",
      cr: spec.entryType === "Cr" ? String(spec.amount) : "",
    }));

    setLines(newLines);
  }

  useEffect(() => {
    if (autoVat && (type === "Sales" || type === "Purchase") && taxableAmount) {
      applyVatLines();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoVat, taxableAmount, type, ledgerByRole]);

  async function handleSave() {
    setLoading(true);
    setError(null);

    const payload = lines
      .filter((l) => l.ledgerId && (l.dr || l.cr))
      .map((l) => ({
        ledgerId: l.ledgerId,
        amount: parseFloat(l.dr || l.cr),
        entryType: (l.dr ? "Dr" : "Cr") as "Dr" | "Cr",
        refType: l.showBill ? l.refType : undefined,
        billNo: l.showBill && l.refType === "New" ? l.billNo || undefined : undefined,
        billDate:
          l.showBill && (l.refType === "New" || l.refType === "OnAccount")
            ? l.billDate || date
            : undefined,
        dueDate: l.showBill && l.dueDate ? l.dueDate : undefined,
        againstBillId:
          l.showBill && l.refType === "Against" ? l.againstBillId || undefined : undefined,
      }));

    try {
      const result =
        mode === "edit" && voucherId
          ? await updateVoucher(voucherId, { type, date, narration, lines: payload })
          : await createVoucher({ type, date, narration, lines: payload });

      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.voucherId) {
        toast.success("Voucher saved — reports updated");
        router.push(`/transactions/vouchers/${result.voucherId}`);
        return;
      }

      setError("Voucher was not saved. Please try again.");
      setLoading(false);
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError("Something went wrong while saving. Please try again.");
      setLoading(false);
    }
  }

  const template = getTemplateForType(type);
  const showVatToggle = type === "Sales" || type === "Purchase";

  return (
    <div className="space-y-6">
      <VoucherTypePicker
        value={type}
        onChange={(t) => {
          setType(t);
          if (t !== "Sales" && t !== "Purchase") setAutoVat(false);
        }}
        disabled={loading}
      />

      {template && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <p className="font-medium">{template.title}</p>
          <p className="mt-1 text-muted-foreground">{template.description}</p>
        </div>
      )}

      {showVatToggle && (
        <div className="rounded-xl border p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={autoVat}
              onChange={(e) => setAutoVat(e.target.checked)}
            />
            Auto VAT 13%
          </label>
          {autoVat && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Taxable Amount (NPR)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={taxableAmount}
                  onChange={(e) => setTaxableAmount(e.target.value)}
                  placeholder="Enter taxable amount"
                />
              </div>
              {vatPreview && (
                <div className="text-sm text-muted-foreground space-y-1 pt-6">
                  <p>Taxable: {vatPreview.taxable.toFixed(2)}</p>
                  <p>VAT 13%: {vatPreview.vat.toFixed(2)}</p>
                  <p>Total: {vatPreview.total.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <LedgerForm
          groups={groups}
          reloadOnSuccess={false}
          onSuccess={handleLedgerCreated}
          trigger={
            <Button type="button" variant="outline" id="inline-ledger-trigger">
              Alt+C Create Ledger
            </Button>
          }
        />
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                  Ledger
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                  Debit (Dr)
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                  Credit (Cr)
                </th>
                <th scope="col" className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                  Bill
                </th>
                <th scope="col" className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="border-b align-top">
                  <td className="px-3 py-2">
                    <Select
                      value={line.ledgerId}
                      onChange={(e) => {
                        const ledgerId = e.target.value;
                        updateLine(index, { ledgerId });
                        if (line.refType === "Against") loadOpenBills(ledgerId);
                      }}
                    >
                      <option value="">Select ledger</option>
                      {groupedLedgers.map(([groupName, groupLedgers]) => (
                        <optgroup key={groupName} label={groupName}>
                          {groupLedgers.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right"
                      value={line.dr}
                      onChange={(e) => handleDrChange(index, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-right"
                      value={line.cr}
                      onChange={(e) => handleCrChange(index, e.target.value)}
                    />
                  </td>
                  <td className="px-3 py-2 space-y-1">
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
                      <div className="space-y-1">
                        <Select
                          value={line.refType}
                          onChange={(e) => {
                            const refType = e.target.value as BillRefType;
                            updateLine(index, { refType });
                            if (refType === "Against" && line.ledgerId) {
                              loadOpenBills(line.ledgerId);
                            }
                          }}
                        >
                          <option value="New">New</option>
                          <option value="Against">Against</option>
                          <option value="OnAccount">On Account</option>
                        </Select>
                        {line.refType === "New" && (
                          <div className="grid grid-cols-1 gap-1">
                            <Input
                              placeholder="Bill No."
                              value={line.billNo}
                              onChange={(e) =>
                                updateLine(index, { billNo: e.target.value })
                              }
                            />
                            <Input
                              type="date"
                              value={line.billDate || date}
                              onChange={(e) =>
                                updateLine(index, { billDate: e.target.value })
                              }
                            />
                            <Input
                              type="date"
                              placeholder="Due date"
                              value={line.dueDate}
                              onChange={(e) =>
                                updateLine(index, { dueDate: e.target.value })
                              }
                            />
                          </div>
                        )}
                        {line.refType === "Against" && (
                          <Select
                            value={line.againstBillId}
                            onChange={(e) => {
                              const billId = e.target.value;
                              const bills = openBillsByLedger[line.ledgerId] ?? [];
                              const bill = bills.find((b) => b.id === billId);
                              updateLine(index, {
                                againstBillId: billId,
                                billNo: bill?.billNo ?? "",
                                billDate: bill?.billDate.slice(0, 10) ?? "",
                                dr: bill ? String(bill.outstanding) : line.dr,
                                cr: bill ? String(bill.outstanding) : line.cr,
                              });
                            }}
                          >
                            <option value="">Select open bill</option>
                            {(openBillsByLedger[line.ledgerId] ?? []).map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.billNo} — outstanding {b.outstanding.toFixed(2)}
                              </option>
                            ))}
                          </Select>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      disabled={lines.length <= 2}
                      onClick={() => removeLine(index)}
                      aria-label="Remove line"
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <BalanceBar totalDr={totalDr} totalCr={totalCr} />
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLines((prev) => [...prev, emptyLine()])}
          >
            Add Line
          </Button>
          <p className="text-xs text-muted-foreground">
            Alt+C Create ledger · Alt+S Save
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          id="save-voucher-btn"
          type="button"
          onClick={handleSave}
          disabled={loading || !isBalanced}
        >
          {loading ? "Saving…" : mode === "edit" ? "Update Voucher" : "Save Voucher"}
        </Button>
      </div>
    </div>
  );
}
