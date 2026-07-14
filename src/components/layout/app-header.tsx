import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { db } from "@/lib/db";
import { getFyLabel } from "@/lib/fy";
import { getActiveCompanyId } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, PlusCircle } from "lucide-react";

export async function AppHeader() {
  const session = await auth();
  const companyId = await getActiveCompanyId();
  const company = companyId
    ? await db.company.findUnique({ where: { id: companyId } })
    : null;

  const fyLabel = company
    ? getFyLabel(new Date(), company.fyStartMonth)
    : null;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 font-medium shadow-sm">
          <Link href="/companies" title="Switch company">
            {company?.name ?? "Select company"}
            <ChevronDown className="size-3.5 opacity-60" />
          </Link>
        </Button>
        {fyLabel && (
          <Badge variant="secondary" className="font-normal">
            {fyLabel}
          </Badge>
        )}
        {session?.user && isAdmin(session.user.role) && (
          <Badge variant="outline" className="text-xs">
            Admin
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button asChild size="sm">
          <Link href="/transactions/vouchers/new">
            <PlusCircle className="size-4" />
            New Voucher
          </Link>
        </Button>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session?.user?.email}
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </div>
    </header>
  );
}
