"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCompany, selectCompanyAction } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { SerializedCompany } from "@/lib/serialize";

export function CompanyGateway({ companies }: { companies: SerializedCompany[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [mailingName, setMailingName] = useState("");
  const [address, setAddress] = useState("");
  const [fyStartMonth, setFyStartMonth] = useState("4");
  const [booksBeginDate, setBooksBeginDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  function resetFields() {
    setName("");
    setMailingName("");
    setAddress("");
    setFyStartMonth("4");
    setBooksBeginDate(new Date().toISOString().slice(0, 10));
    setError(null);
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("mailingName", mailingName);
    formData.set("address", address);
    formData.set("fyStartMonth", fyStartMonth);
    formData.set("booksBeginDate", booksBeginDate);
    formData.set("currency", "NPR");

    try {
      const result = await createCompany(formData);
      if (result?.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setOpen(false);
      resetFields();
      setLoading(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) resetFields();
          }}
        >
          <DialogTrigger asChild>
            <Button type="button">Create Company</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mailingName">Mailing Name</Label>
                <Input
                  id="mailingName"
                  value={mailingName}
                  onChange={(e) => setMailingName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fyStartMonth">FY Start Month</Label>
                  <Select
                    id="fyStartMonth"
                    value={fyStartMonth}
                    onChange={(e) => setFyStartMonth(e.target.value)}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i).toLocaleString("en", { month: "long" })}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booksBeginDate">Books Begin Date *</Label>
                  <Input
                    id="booksBeginDate"
                    type="date"
                    value={booksBeginDate}
                    onChange={(e) => setBooksBeginDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value="NPR (Nepalese Rupee)" readOnly className="bg-muted" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button
                  type="button"
                  onClick={handleCreate}
                  disabled={loading || !name || !booksBeginDate}
                >
                  {loading ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No companies yet. Create your first company to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle>{company.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company.address && (
                  <p className="text-sm text-muted-foreground">{company.address}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Books from:{" "}
                  {new Date(company.booksBeginDate).toLocaleDateString("en-NP")}
                  {" · "}
                  {company.currency}
                </p>
                <form action={selectCompanyAction.bind(null, company.id)}>
                  <Button type="submit" className="w-full">
                    Select &amp; Work
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
