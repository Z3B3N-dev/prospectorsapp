import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { InitialsAvatar } from "@/app/components/InitialsAvatar";
import { getEnterpriseList } from "@/lib/enterprises/api";
import { ENTERPRISE_TYPE_LABELS_ES } from "@/lib/enterprises/labels.es";
import { getCurrentFakeUser } from "@/lib/fake-auth";
import { getOrganizations } from "@/lib/organizations/api";

import { NameSearchInput } from "../components/NameSearchInput";
import { createEnterprise } from "./actions";
import { EnterpriseFormModal } from "./components/EnterpriseFormModal";

type SearchParams = Promise<{ q?: string }>;

export default async function EnterprisePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const fakeUser = await getCurrentFakeUser();
  if (!fakeUser) {
    redirect("/login");
  }
  if (fakeUser.role === "tutor") {
    redirect("/contacts");
  }

  const { q } = await searchParams;
  const activeQuery = (q ?? "").trim();

  const [enterprises, organizationOptions] = await Promise.all([
    getEnterpriseList({ q: activeQuery || undefined }),
    getOrganizations(),
  ]);

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Empresas
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {enterprises.length} empresa{enterprises.length !== 1 ? "s" : ""}
            {activeQuery ? ` para "${activeQuery}"` : ""}
          </p>
        </div>
        {fakeUser.canWrite ? (
          <EnterpriseFormModal
            action={createEnterprise}
            organizationOptions={organizationOptions}
            mode="create"
            triggerLabel="Nueva empresa"
            title="Nueva empresa"
            submitLabel="Crear empresa"
          />
        ) : null}
      </div>

      <div className="mb-4">
        <Suspense>
          <NameSearchInput
            basePath="/enterprise"
            activeQuery={activeQuery}
            placeholder="Buscar por nombre de empresa..."
          />
        </Suspense>
      </div>

      {enterprises.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {activeQuery
            ? `No se encontraron empresas para "${activeQuery}".`
            : "No hay empresas registradas."}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Grupo empresarial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ciudad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Provincia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {enterprises.map((enterprise) => (
                  <tr
                    key={enterprise.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={enterprise.name} />
                        <Link
                          href={`/enterprise/${enterprise.id}`}
                          className="font-medium text-gray-900 dark:text-gray-100 underline-offset-2 hover:underline"
                        >
                          {enterprise.name ?? "—"}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {enterprise.type
                        ? ENTERPRISE_TYPE_LABELS_ES[enterprise.type]
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {enterprise.organization_id ? (
                        <Link
                          href={`/organizations/${enterprise.organization_id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {enterprise.organization_name ?? "—"}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {enterprise.city ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {enterprise.province ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
