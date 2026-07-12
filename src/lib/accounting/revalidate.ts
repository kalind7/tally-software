import { revalidatePath } from "next/cache";

export const VOUCHER_MUTATION_PATHS = [
  "/transactions/vouchers",
  "/transactions/day-book",
  "/transactions/bills",
  "/reports/trial-balance",
  "/reports/profit-loss",
  "/reports/balance-sheet",
  "/masters/ledgers",
  "/dashboard",
] as const;

export function revalidateAfterVoucherMutation() {
  for (const path of VOUCHER_MUTATION_PATHS) {
    revalidatePath(path);
  }
}
