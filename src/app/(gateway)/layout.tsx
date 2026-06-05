import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function GatewayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="flex items-center justify-between border-b bg-background px-6 py-4">
        <h1 className="text-lg font-semibold">Tallyco Soft</h1>
        <div className="flex items-center gap-3">
          {session?.user?.email && (
            <span className="text-sm text-muted-foreground">
              {session.user.email}
            </span>
          )}
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
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
