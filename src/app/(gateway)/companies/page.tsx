import { getCompanies } from "@/lib/actions/company";
import { requireAuth } from "@/lib/session";
import { isAdmin } from "@/lib/access";
import { PageHeader } from "@/components/layout/page-header";
import { CompanyGateway } from "@/components/forms/company-gateway";

export default async function CompaniesPage() {
  const session = await requireAuth();
  const companies = await getCompanies();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Company Gateway"
        description={
          isAdmin(session.user.role)
            ? "Admin view — all companies. Select one to work or create a new company."
            : "Select your company or create a new one."
        }
      />
      <CompanyGateway companies={companies} isAdmin={isAdmin(session.user.role)} />
    </div>
  );
}
