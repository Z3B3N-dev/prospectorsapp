import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { InitialsAvatar } from "@/app/components/InitialsAvatar";
import { getCurrentFakeUser } from "@/lib/fake-auth";
import { getOrganizationList } from "@/lib/organizations/api";

import { NameSearchInput } from "../components/NameSearchInput";
import { createOrganization } from "./actions";
import { OrganizationFormModal } from "./components/OrganizationFormModal";

type SearchParams = Promise<{ q?: string }>;

export default async function OrganizationsPage({
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

  const organizations = await getOrganizationList({
    q: activeQuery || undefined,
  });

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Grupos empresariales
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {organizations.length} grupo{organizations.length !== 1 ? "s" : ""}
            {activeQuery ? ` para "${activeQuery}"` : ""}
          </p>
        </div>
        {fakeUser.canWrite ? (
          <OrganizationFormModal
            action={createOrganization}
            mode="create"
            triggerLabel="Nuevo grupo"
            title="Nuevo grupo empresarial"
            submitLabel="Crear grupo"
          />
        ) : null}
      </div>

      <div className="mb-4">
        <Suspense>
          <NameSearchInput
            basePath="/organizations"
            activeQuery={activeQuery}
            placeholder="Buscar por nombre de grupo empresarial..."
          />
        </Suspense>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
          {activeQuery
            ? `No se encontraron grupos para "${activeQuery}".`
            : "No hay grupos empresariales registrados."}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Ciudad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Provincia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Teléfono</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={org.name} />
                        <Link
                          href={`/organizations/${org.id}`}
                          className="font-medium text-gray-900 dark:text-gray-100 underline-offset-2 hover:underline"
                        >
                          {org.name ?? "—"}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {org.city ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {org.province ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {org.phone ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {org.email ?? "—"}
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
