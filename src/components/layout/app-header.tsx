import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActiveCompanyId } from "@/lib/session";
import { Button } from "@/components/ui/button";

export async function AppHeader() {
  const session = await auth();
  const companyId = await getActiveCompanyId();
  const company = companyId
    ? await db.company.findUnique({ where: { id: companyId } })
    : null;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Company:</span>
        <Link
          href="/companies"
          className="font-medium hover:underline"
        >
          {company?.name ?? "Select company"}
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
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
