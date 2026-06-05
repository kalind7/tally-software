"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SortToggle({
  current,
  basePath,
}: {
  current: "asc" | "desc";
  basePath: string;
}) {
  const next = current === "asc" ? "desc" : "asc";
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={`${basePath}?sort=${next}`}>
        Sort: {current === "asc" ? "Oldest first" : "Newest first"}
      </Link>
    </Button>
  );
}
