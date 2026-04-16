import Link from "next/link";
import { redirect } from "next/navigation";

import { getDashboardStats, getRecentInteractions } from "@/lib/contacts/api";
import {
  INTERACTION_STATUS_LABELS_ES,
  INTERACTION_TYPE_LABELS_ES,
} from "@/lib/contacts/labels.es";
import { INTERACTION_STATUS_PILL_CLASSNAMES } from "@/lib/contacts/status-pill";
import type { InteractionStatus } from "@/lib/contacts/types";
import { getCurrentFakeUser } from "@/lib/fake-auth";

import { InitialsAvatar } from "./components/InitialsAvatar";

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default async function DashboardPage() {
  const fakeUser = await getCurrentFakeUser();

  if (!fakeUser) {
    redirect("/login");
  }

  const [stats, recentInteractions] = await Promise.all([
    getDashboardStats(),
    getRecentInteractions(10),
  ]);

  const statCards = [
    {
      key: 1,
      label: "Contactos activos",
      value: stats.totalContacts,
      href: "/contacts",
    },
    {
      key: 2,
      label: "Empresas",
      value: stats.totalEnterprises,
      href: "/enterprise",
    },
    {
      key: 3,
      label: "Organizaciones",
      value: stats.totalOrganizations,
      href: "/organizations",
    },
    {
      key: 4,
      label: "Acuerdos alcanzados",
      value: stats.agreementReachedCount,
      href: "/contacts?status=agreement_reached",
    },
  ];

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Resumen general
        </p>
      </div>

      {/* Stat cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.key}
            href={card.href}
            className="group block rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-5 hover:border-gray-300 dark:hover:border-zinc-600 transition-colors"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {card.value}
            </p>
          </Link>
        ))}
      </section>

      {/* Recent interactions */}
      <section className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Actividad reciente
          </h2>
        </div>

        {recentInteractions.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay interacciones registradas aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {recentInteractions.map((interaction) => (
                  <tr
                    key={interaction.id}
                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={interaction.contact_name} />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {interaction.contact_name ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {interaction.enterprise_name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      {INTERACTION_TYPE_LABELS_ES[
                        interaction.type as keyof typeof INTERACTION_TYPE_LABELS_ES
                      ] ?? interaction.type}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${INTERACTION_STATUS_PILL_CLASSNAMES[interaction.status as InteractionStatus] ?? INTERACTION_STATUS_PILL_CLASSNAMES.unknown}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                        {INTERACTION_STATUS_LABELS_ES[
                          interaction.status as InteractionStatus
                        ] ?? interaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {formatDate(interaction.occurred_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {interaction.contact_id ? (
                        <Link
                          href={`/contacts/${interaction.contact_id}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline"
                        >
                          Ver
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
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
