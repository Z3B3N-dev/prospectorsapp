import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getProfessionalFamilies } from "@/lib/professional-families/api";
import {
  getCiclosByFamilies,
  getContacts,
  getContactCicloInteractions,
  getContactFamilies,
  getContactInteractionSummaries,
} from "@/lib/contacts/api";
import { INTERACTION_STATUS_SET } from "@/lib/contacts/constants";
import type {
  Contact,
  ContactInteractionSummary,
  ContactSortField,
  InteractionStatus,
  SortDirection,
} from "@/lib/contacts/types";
import { getEnterpriseContactOptions } from "@/lib/enterprises/api";
import { getCurrentFakeUser } from "@/lib/fake-auth";
import { getOrganizations } from "@/lib/organizations/api";
import { createContact } from "./actions";
import { CreateContactModal } from "./components/CreateContactModal";
import { ContactsFilters } from "./components/ContactsFilters";
import { ContactsTable } from "./components/ContactsTable";
import { EmptyState } from "./components/EmptyState";

type SearchParams = Promise<{
  family?: string;
  families?: string;
  ciclo?: string;
  q?: string;
  status?: string;
  sort?: string;
  order?: string;
}>;

function isInteractionStatus(value?: string): value is InteractionStatus {
  return !!value && INTERACTION_STATUS_SET.has(value as InteractionStatus);
}

const TEXT_COLLATOR = new Intl.Collator("es", {
  sensitivity: "base",
  numeric: true,
});

const CONTACT_SORT_FIELDS: ContactSortField[] = [
  "name",
  "organization",
  "enterprise",
  "requested_students",
  "last_interaction",
];

function isContactSortField(value?: string): value is ContactSortField {
  return !!value && CONTACT_SORT_FIELDS.includes(value as ContactSortField);
}

function toSortDirection(value?: string): SortDirection {
  return value === "desc" ? "desc" : "asc";
}

function compareNullableText(a: string | null, b: string | null): number {
  return TEXT_COLLATOR.compare(a ?? "", b ?? "");
}

function getLastInteractionTimestamp(
  contactId: string,
  interactionSummaryMap: Map<string, ContactInteractionSummary>,
): number {
  const lastInteractionAt = interactionSummaryMap.get(contactId)?.lastInteractionAt;
  if (!lastInteractionAt) return Number.NEGATIVE_INFINITY;

  const timestamp = Date.parse(lastInteractionAt);
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

function compareContacts(
  a: Contact,
  b: Contact,
  sortField: ContactSortField,
  interactionSummaryMap: Map<string, ContactInteractionSummary>,
): number {
  if (sortField === "requested_students") {
    const valueA = interactionSummaryMap.get(a.id)?.requestedStudentsTotal ?? 0;
    const valueB = interactionSummaryMap.get(b.id)?.requestedStudentsTotal ?? 0;
    if (valueA !== valueB) return valueA - valueB;
  } else if (sortField === "last_interaction") {
    const valueA = getLastInteractionTimestamp(a.id, interactionSummaryMap);
    const valueB = getLastInteractionTimestamp(b.id, interactionSummaryMap);
    if (valueA !== valueB) return valueA - valueB;
  } else if (sortField === "organization") {
    const result = compareNullableText(a.organization?.name ?? null, b.organization?.name ?? null);
    if (result !== 0) return result;
  } else if (sortField === "enterprise") {
    const result = compareNullableText(a.enterprise?.name ?? null, b.enterprise?.name ?? null);
    if (result !== 0) return result;
  } else {
    const result = compareNullableText(a.name, b.name);
    if (result !== 0) return result;
  }

  const byName = compareNullableText(a.name, b.name);
  if (byName !== 0) return byName;
  return a.id.localeCompare(b.id);
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const fakeUser = await getCurrentFakeUser();
  if (!fakeUser) {
    redirect("/login");
  }

  const params = await searchParams;
  const activeSortField = isContactSortField(params.sort) ? params.sort : null;
  const activeSortOrder = toSortDirection(params.order);
  const currentQueryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && value.length > 0) {
      currentQueryParams.set(key, value);
    }
  }
  const currentQuery = currentQueryParams.toString();

  const tutorFamilyId =
    fakeUser.role === "tutor" ? fakeUser.professionalFamilyId : null;

  // Parse active family IDs from URL
  const requestedFamilyId = params.family ?? null;
  const requestedCicloId = params.ciclo ?? null;
  const requestedSearchQuery = (params.q ?? "").trim();
  const activeStatus = isInteractionStatus(params.status) ? params.status : null;

  const familyIds = tutorFamilyId
    ? [tutorFamilyId]
    : params.families
      ? params.families.split(",").filter(Boolean)
      : requestedFamilyId
        ? [requestedFamilyId]
        : undefined;

  const activeFamilyId = tutorFamilyId ?? requestedFamilyId;

  const [families, ciclos, organizationOptions, enterpriseOptions] =
    await Promise.all([
      getProfessionalFamilies(),
      activeFamilyId
        ? getCiclosByFamilies([activeFamilyId])
        : Promise.resolve([]),
      getOrganizations(),
      getEnterpriseContactOptions(),
    ]);

  const visibleFamilies = tutorFamilyId
    ? families.filter((family) => family.id === tutorFamilyId)
    : families;

  const activeCicloId = ciclos.some((ciclo) => ciclo.id === requestedCicloId)
    ? requestedCicloId
    : null;

  const contactosFilters = {
    familyIds,
    cicloId: activeCicloId ?? undefined,
    search: requestedSearchQuery || undefined,
    status: activeStatus ?? undefined,
  };

  const contacts = await getContacts(contactosFilters);

  const contactIds = contacts.map((c) => c.id);
  const [cicloInteractionsMap, familiesMap, interactionSummaryMap] =
    await Promise.all([
      getContactCicloInteractions(contactIds),
      getContactFamilies(contactIds),
      getContactInteractionSummaries(contactIds),
    ]);

  const displayedContacts = activeSortField
    ? [...contacts].sort((a, b) => {
        const comparison = compareContacts(
          a,
          b,
          activeSortField,
          interactionSummaryMap,
        );

        return activeSortOrder === "asc" ? comparison : -comparison;
      })
    : contacts;

  const isFiltered =
    (familyIds?.length ?? 0) > 0 ||
    !!activeCicloId ||
    requestedSearchQuery.length > 0 ||
    !!activeStatus;

  return (
    <main className="max-w-screen-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Contactos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {displayedContacts.length} contacto{displayedContacts.length !== 1 ? "s" : ""}
            {isFiltered ? " para los filtros seleccionados" : ""}
          </p>
        </div>
        {fakeUser.canWrite ? (
          <CreateContactModal
            action={createContact}
            organizationOptions={organizationOptions}
            enterpriseOptions={enterpriseOptions}
          />
        ) : null}
      </div>

      <div className="mb-4">
        <Suspense>
          <ContactsFilters
            families={visibleFamilies}
            ciclos={ciclos}
            activeFamilyId={activeFamilyId}
            activeCicloId={activeCicloId}
            activeSearchQuery={requestedSearchQuery}
            activeStatus={activeStatus}
            lockFamilySelection={!!tutorFamilyId}
          />
        </Suspense>
      </div>

      {displayedContacts.length === 0 ? (
        <EmptyState filtered={isFiltered} />
      ) : (
        <ContactsTable
          contacts={displayedContacts}
          cicloInteractionsMap={cicloInteractionsMap}
          familiesMap={familiesMap}
          interactionSummaryMap={interactionSummaryMap}
          activeSortField={activeSortField}
          activeSortOrder={activeSortOrder}
          currentQuery={currentQuery}
        />
      )}
    </main>
  );
}
