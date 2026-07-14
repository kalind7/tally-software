"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { deleteVoucher } from "@/lib/actions/voucher";
import { Button } from "@/components/ui/button";

export function VoucherActions({ voucherId }: { voucherId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Delete this voucher? This cannot be undone if no bills are settled against it."
      )
    ) {
      return;
    }
    setLoading(true);
    const result = await deleteVoucher(voucherId);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success("Voucher deleted");
    router.push("/transactions/vouchers");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" asChild>
        <Link href={`/transactions/vouchers/${voucherId}/edit`}>Edit</Link>
      </Button>
      <Button variant="destructive" onClick={handleDelete} disabled={loading}>
        {loading ? "Deleting…" : "Delete"}
      </Button>
      <Button variant="outline" asChild>
        <Link href="/transactions/vouchers">Back to list</Link>
      </Button>
    </div>
  );
}
