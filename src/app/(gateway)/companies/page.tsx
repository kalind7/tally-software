import { getCompanies } from "@/lib/actions/company";
import { requireAuth } from "@/lib/session";
import { CompanyGateway } from "@/components/forms/company-gateway";

export default async function CompaniesPage() {
  await requireAuth();
  const companies = await getCompanies();

  // #region agent log
  if (companies[0]) {
    fetch("http://127.0.0.1:7425/ingest/6043b083-ac5a-4add-b841-3273d5cc4860", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "32c864",
      },
      body: JSON.stringify({
        sessionId: "32c864",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "companies/page.tsx",
        message: "passing companies to CompanyGateway client component",
        data: {
          companyCount: companies.length,
          booksBeginDateCtor:
            companies[0].booksBeginDate?.constructor?.name ?? "none",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }
  // #endregion

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Company Gateway</h1>
        <p className="text-muted-foreground">
          Select a company to work with or create a new one.
        </p>
      </div>
      <CompanyGateway companies={companies} />
    </div>
  );
}
