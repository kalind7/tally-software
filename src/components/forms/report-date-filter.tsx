"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function ReportDateFilter({
  basePath,
  fields,
  defaults,
}: {
  basePath: string;
  fields: { name: string; label: string }[];
  defaults: Record<string, string>;
}) {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    fields.forEach((f) => {
      const val = formData.get(f.name) as string;
      if (val) params.set(f.name, val);
    });
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-xl border bg-muted/20 p-4"
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            type="date"
            defaultValue={defaults[field.name]}
          />
        </div>
      ))}
      <Button type="submit">Apply</Button>
    </form>
  );
}
