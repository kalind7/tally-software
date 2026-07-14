"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GroupNature } from "@prisma/client";

type LedgerRow = {
  id: string;
  name: string;
  openingBalance: number | string;
  openingType: string;
};

type GroupRow = {
  id: string;
  name: string;
  nature: GroupNature;
  ledgers: LedgerRow[];
};

const NATURES: GroupNature[] = ["Asset", "Liability", "Income", "Expense"];

export function ChartOfAccountsTable({ groups }: { groups: GroupRow[] }) {
  const [natureFilter, setNatureFilter] = useState<GroupNature | "all">("all");

  const filtered = useMemo(
    () =>
      natureFilter === "all"
        ? groups
        : groups.filter((g) => g.nature === natureFilter),
    [groups, natureFilter]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={natureFilter === "all" ? "default" : "outline"}
          onClick={() => setNatureFilter("all")}
        >
          All groups
        </Button>
        {NATURES.map((nature) => (
          <Button
            key={nature}
            type="button"
            size="sm"
            variant={natureFilter === nature ? "default" : "outline"}
            onClick={() => setNatureFilter(nature)}
          >
            {nature}
          </Button>
        ))}
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Group</TableHead>
              <TableHead>Nature</TableHead>
              <TableHead>Ledger</TableHead>
              <TableHead className="text-right">Opening Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No groups match this filter.
                </TableCell>
              </TableRow>
            ) : (
              filtered.flatMap((group) =>
                group.ledgers.length > 0
                  ? group.ledgers.map((ledger, idx) => (
                      <TableRow key={ledger.id}>
                        <TableCell>{idx === 0 ? group.name : ""}</TableCell>
                        <TableCell>
                          {idx === 0 ? (
                            <Badge variant="secondary">{group.nature}</Badge>
                          ) : (
                            ""
                          )}
                        </TableCell>
                        <TableCell>{ledger.name}</TableCell>
                        <TableCell className="text-right">
                          {Number(ledger.openingBalance).toFixed(2)}{" "}
                          {ledger.openingType}
                        </TableCell>
                      </TableRow>
                    ))
                  : [
                      <TableRow key={group.id}>
                        <TableCell>{group.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{group.nature}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          No ledgers
                        </TableCell>
                        <TableCell />
                      </TableRow>,
                    ]
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
