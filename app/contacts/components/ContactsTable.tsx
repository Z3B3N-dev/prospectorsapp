import Link from "next/link";

import { InitialsAvatar } from "@/app/components/InitialsAvatar";
import type {
  Contact,
  ContactCicloEntry,
  ContactInteractionSummary,
  ContactSortField,
  SortDirection,
} from "@/lib/contacts/types";
import type { ProfessionalFamily } from "@/lib/professional-families/types";

import { InteractionStatusPill } from "./InteractionStatusPill";

type Props = {
  contacts: Contact[];
  cicloInteractionsMap?: Map<string, ContactCicloEntry[]>;
  familiesMap?: Map<string, ProfessionalFamily[]>;
  interactionSummaryMap?: Map<string, ContactInteractionSummary>;
  activeSortField: ContactSortField | null;
  activeSortOrder: SortDirection;
  currentQuery: string;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function ContactsTable({
  contacts,
  cicloInteractionsMap,
  familiesMap,
  interactionSummaryMap,
  activeSortField,
  activeSortOrder,
  currentQuery,
}: Props) {
  function buildSortHref(sortField: ContactSortField): string {
    const params = new URLSearchParams(currentQuery);
    const nextSortOrder =
      activeSortField === sortField && activeSortOrder === "asc"
        ? "desc"
        : "asc";

    params.set("sort", sortField);
    params.set("order", nextSortOrder);

    const query = params.toString();
    return query ? `/contacts?${query}` : "/contacts";
  }

  function renderSortableHeader(label: string, sortField: ContactSortField) {
    const isActive = activeSortField === sortField;
    const arrow = isActive ? (activeSortOrder === "asc" ? "↑" : "↓") : null;

    return (
      <Link
        href={buildSortHref(sortField)}
        className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <span>{label}</span>
        {arrow ? (
          <span aria-hidden="true" className="text-blue-600 dark:text-blue-300">
            {arrow}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-zinc-700">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {renderSortableHeader("Nombre", "name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {renderSortableHeader("Empresa", "enterprise")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Teléfono
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Familias profesionales
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Interesado en
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {renderSortableHeader("Alumnos solicitados", "requested_students")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {renderSortableHeader("Última interacción", "last_interaction")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
            {contacts.map((contact) => {
              const entries = cicloInteractionsMap?.get(contact.id) ?? [];
              const families = familiesMap?.get(contact.id) ?? [];
              const summary = interactionSummaryMap?.get(contact.id);

              return (
                <tr
                  key={contact.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={contact.name} />
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-gray-900 dark:text-gray-100 underline-offset-2 hover:underline"
                      >
                        {contact.name ?? "—"}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {contact.enterprise ? (
                      <Link
                        href={`/enterprise/${contact.enterprise.id}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {contact.enterprise.name ?? "—"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {contact.phone ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {contact.email ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    {families.length === 0 ? (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {families.map((f) => (
                          <span
                            key={f.id}
                            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                          >
                            {f.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {entries.length === 0 ? (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {entries.map((entry) => (
                          <span
                            key={entry.cicloId}
                            className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                          >
                            {entry.cicloName}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {summary?.requestedStudentsTotal ?? 0}
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                    {summary?.lastInteractionAt ? (
                      <div className="space-y-1 min-w-max">
                        <p>{formatDateTime(summary.lastInteractionAt)}</p>
                        {summary.lastInteractionStatus ? (
                          <InteractionStatusPill
                            status={summary.lastInteractionStatus}
                            size="sm"
                          />
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
