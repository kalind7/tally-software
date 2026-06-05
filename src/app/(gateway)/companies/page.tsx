import { getCompanies } from "@/lib/actions/company";
import { requireAuth } from "@/lib/session";
import { CompanyGateway } from "@/components/forms/company-gateway";

export default async function CompaniesPage() {
  await requireAuth();
  const companies = await getCompanies();

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
