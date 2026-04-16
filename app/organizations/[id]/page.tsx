import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getEnterpriseList } from "@/lib/enterprises/api";
import { ENTERPRISE_TYPE_LABELS_ES } from "@/lib/enterprises/labels.es";
import { getCurrentFakeUser } from "@/lib/fake-auth";
import { getOrganizationById } from "@/lib/organizations/api";
import { deleteOrganization, updateOrganization } from "./actions";
import { DeleteButton } from "@/app/components/DeleteButton";
import { OrganizationFormModal } from "../components/OrganizationFormModal";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationDetailPage({ params }: Props) {
  const fakeUser = await getCurrentFakeUser();
  if (!fakeUser) {
    redirect("/login");
  }
  if (fakeUser.role === "tutor") {
    redirect("/contacts");
  }

  const { id } = await params;
  const [organization, allEnterprises] = await Promise.all([
    getOrganizationById(id),
    getEnterpriseList(),
  ]);

  if (!organization) {
    notFound();
  }

  const enterprises = allEnterprises.filter((e) => e.organization_id === id);

  const updateAction = updateOrganization.bind(null, id);
  const deleteAction = deleteOrganization.bind(null, id);

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link
              href="/organizations"
              className="hover:underline underline-offset-2"
            >
              Grupos empresariales
            </Link>{" "}
            /
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {organization.name ?? "Grupo sin nombre"}
          </h1>
        </div>

        {fakeUser.canWrite || fakeUser.canDelete ? (
          <div className="flex gap-2">
            {fakeUser.canWrite ? (
              <OrganizationFormModal
                action={updateAction}
                initialValues={organization}
                mode="edit"
                triggerLabel="Editar grupo"
                title="Editar grupo empresarial"
                submitLabel="Guardar cambios"
                triggerClassName="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
              />
            ) : null}
            {fakeUser.canDelete ? (
              <DeleteButton
                action={deleteAction}
                confirmMessage="¿Eliminar este grupo empresarial? Esta acción no se puede deshacer."
              />
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 mb-8">
        <Row label="Nombre" value={organization.name} />
        <Row label="Dirección" value={organization.address} />
        <Row label="Ciudad" value={organization.city} />
        <Row label="Provincia" value={organization.province} />
        <Row label="Teléfono" value={organization.phone} />
        <Row label="Email" value={organization.email} />
      </div>

      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Empresas del grupo
          <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
            ({enterprises.length})
          </span>
        </h2>

        {enterprises.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay empresas vinculadas a este grupo.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Ciudad</th>
                  <th className="px-4 py-3 text-left">Provincia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {enterprises.map((enterprise) => (
                  <tr
                    key={enterprise.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      <Link
                        href={`/enterprise/${enterprise.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {enterprise.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {enterprise.type
                        ? ENTERPRISE_TYPE_LABELS_ES[enterprise.type]
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {enterprise.city ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {enterprise.province ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
