import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEnterpriseById } from "@/lib/enterprises/api";
import { ENTERPRISE_TYPE_LABELS_ES } from "@/lib/enterprises/labels.es";
import { getCurrentFakeUser } from "@/lib/fake-auth";
import { getOrganizations } from "@/lib/organizations/api";
import { deleteEnterprise, updateEnterprise } from "./actions";
import { DeleteButton } from "@/app/components/DeleteButton";
import { EnterpriseFormModal } from "../components/EnterpriseFormModal";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EnterpriseDetailPage({ params }: Props) {
  const fakeUser = await getCurrentFakeUser();
  if (!fakeUser) {
    redirect("/login");
  }
  if (fakeUser.role === "tutor") {
    redirect("/contacts");
  }

  const { id } = await params;
  const [enterprise, organizationOptions] = await Promise.all([
    getEnterpriseById(id),
    getOrganizations(),
  ]);

  if (!enterprise) {
    notFound();
  }

  const updateAction = updateEnterprise.bind(null, id);
  const deleteAction = deleteEnterprise.bind(null, id);

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link href="/enterprise" className="hover:underline underline-offset-2">
              Empresas
            </Link>{" "}
            /
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {enterprise.name ?? "Empresa sin nombre"}
          </h1>
          {enterprise.organization_name ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <Link
                href={`/organizations/${enterprise.organization_id}`}
                className="hover:underline underline-offset-2"
              >
                {enterprise.organization_name}
              </Link>
            </p>
          ) : null}
        </div>

        {fakeUser.canWrite || fakeUser.canDelete ? (
          <div className="flex gap-2">
            {fakeUser.canWrite ? (
              <EnterpriseFormModal
                action={updateAction}
                organizationOptions={organizationOptions}
                initialValues={enterprise}
                mode="edit"
                triggerLabel="Editar empresa"
                title="Editar empresa"
                submitLabel="Guardar cambios"
                triggerClassName="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
              />
            ) : null}
            {fakeUser.canDelete ? (
              <DeleteButton
                action={deleteAction}
                confirmMessage="¿Eliminar esta empresa? Esta acción no se puede deshacer."
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        <Row label="Nombre" value={enterprise.name} />
        <Row
          label="Tipo"
          value={
            enterprise.type ? ENTERPRISE_TYPE_LABELS_ES[enterprise.type] : null
          }
        />
        <Row label="Grupo empresarial" value={enterprise.organization_name} />
        <Row label="Dirección" value={enterprise.address} />
        <Row label="Ciudad" value={enterprise.city} />
        <Row label="Provincia" value={enterprise.province} />
        <Row label="CIF / NIF" value={enterprise.tax_id} />
      </div>
    </main>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 md:flex-row md:gap-0">
      <span className="w-40 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-gray-100">
        {value ?? "—"}
      </span>
    </div>
  );
}
