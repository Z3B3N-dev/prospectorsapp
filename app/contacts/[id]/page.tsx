import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import {
  getAllActiveCiclos,
  getCiclosByFamilies,
  getContactDetail,
  getContactFamilyLinks,
  getContactInteractions,
} from "@/lib/contacts/api";
import {
  OPEN_INTERACTION_STATUSES,
  REQUESTED_STUDENTS_REQUIRED_STATUS_SET,
} from "@/lib/contacts/constants";
import { INTERACTION_TYPE_OPTIONS_ES } from "@/lib/contacts/labels.es";
import { getEnterpriseContactOptions } from "@/lib/enterprises/api";
import {
  getCurrentFakeUser,
  resolveUserDisplayNamesByIds,
} from "@/lib/fake-auth";
import { getOrganizations } from "@/lib/organizations/api";
import { getProfessionalFamilies } from "@/lib/professional-families/api";
import { getFpCenterFormOptions } from "@/lib/fp-centers/api";
import { DeleteButton } from "@/app/components/DeleteButton";
import { InteractionStatusPill } from "../components/InteractionStatusPill";
import { CreateInteractionModal } from "./components/CreateInteractionModal";
import { EditContactModal } from "./components/EditContactModal";
import {
  createInteractionForContact,
  deleteContact,
  deleteInteractionForContact,
  updateContact,
  updateInteractionForContact,
} from "./actions";

type Params = Promise<{ id: string }>;

export default async function ContactDetailPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const fakeUser = await getCurrentFakeUser();
  if (!fakeUser) {
    redirect("/login");
  }

  const contact = await getContactDetail(id);
  if (!contact) notFound();

  const organization = contact.organization;
  const enterprise = contact.enterprise;

  const tutorFamilyId =
    fakeUser.role === "tutor" ? fakeUser.professionalFamilyId : null;

  const [
    contactFamilies,
    allInteractions,
    organizationOptions,
    enterpriseOptions,
    professionalFamilies,
    fpCenterFormOptions,
  ] = await Promise.all([
    getContactFamilyLinks(contact.id),
    getContactInteractions(contact.id),
    getOrganizations(),
    getEnterpriseContactOptions(),
    getProfessionalFamilies(),
    getFpCenterFormOptions(),
  ]);

  const families = tutorFamilyId
    ? contactFamilies.filter((family) => family.id === tutorFamilyId)
    : contactFamilies;

  if (tutorFamilyId && families.length === 0) {
    notFound();
  }

  const ciclos = tutorFamilyId
    ? await getCiclosByFamilies([tutorFamilyId])
    : await getAllActiveCiclos();
  const cicloIds = new Set(ciclos.map((ciclo) => ciclo.id));

  const interactions = tutorFamilyId
    ? allInteractions.filter((interaction) =>
        interaction.targets.some(
          (target) =>
            target.professional_family_id !== null &&
            target.professional_family_id === tutorFamilyId &&
            (target.ciclo_formativo_id === null ||
              cicloIds.has(target.ciclo_formativo_id)),
        ),
      )
    : allInteractions;

  const openCicloIds = interactions
    .filter((i) => OPEN_INTERACTION_STATUSES.includes(i.status))
    .flatMap((i) => i.targets)
    .map((target) => target.ciclo_formativo_id)
    .filter((value): value is string => Boolean(value));

  const requestedStudentsTotal = interactions.reduce((total, interaction) => {
    if (!REQUESTED_STUDENTS_REQUIRED_STATUS_SET.has(interaction.status)) {
      return total;
    }
    return total + (interaction.requested_students ?? 0);
  }, 0);

  const createAction = createInteractionForContact.bind(null, contact.id);
  const updateContactAction = updateContact.bind(null, contact.id);
  const deleteContactAction = deleteContact.bind(null, contact.id);
  const canWrite = fakeUser.canWrite;
  const canDelete = fakeUser.canDelete;
  const userDisplayNames = await resolveUserDisplayNamesByIds([
    contact.created_by,
    contact.updated_by,
  ]);
  const createdAtLabel = contact.created_at
    ? new Date(contact.created_at).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "No informado";
  const createdByLabel = contact.created_by
    ? (userDisplayNames.get(contact.created_by) ?? "No informado")
    : "No informado";
  const updatedAtLabel = contact.updated_at
    ? new Date(contact.updated_at).toLocaleString("es-ES", {
        dateStyle: "short",
        timeStyle: "short",
      })
    : "No informado";
  const updatedByLabel = contact.updated_by
    ? (userDisplayNames.get(contact.updated_by) ?? "No informado")
    : "No informado";

  return (
    <main className="mx-auto flex w-full max-w-screen-2xl flex-col gap-8 px-4 py-8">
      <header className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 md:p-6">
        <Link
          href="/contacts"
          className="inline-flex text-sm font-medium text-blue-600 hover:underline"
        >
          ← Volver a contactos
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {contact.name ?? "Contacto"}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Grupo empresarial: {organization?.name ?? "Sin grupo empresarial"}
            </p>
            <p className="text-base text-gray-500 dark:text-gray-400">
              Empresa: {enterprise?.name ?? "Sin empresa"}
            </p>
            <p className="text-xs text-gray-500">
              Sesión activa:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {fakeUser.username}
              </span>{" "}
              · Rol{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {fakeUser.role}
              </span>
            </p>
          </div>
          {canWrite || canDelete ? (
            <div className="flex flex-wrap items-center gap-2">
              {canWrite ? (
                <EditContactModal
                  action={updateContactAction}
                  initialValues={{
                    name: contact.name,
                    position: contact.position,
                    phone: contact.phone,
                    second_phone: contact.second_phone,
                    email: contact.email,
                    organization: contact.organization,
                    enterprise: contact.enterprise,
                  }}
                  organizationOptions={organizationOptions}
                  enterpriseOptions={enterpriseOptions}
                />
              ) : null}
              {canDelete ? (
                <DeleteButton
                  action={deleteContactAction}
                  confirmMessage="¿Seguro que quieres eliminar este contacto?"
                  label="Eliminar contacto"
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <dl className="rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 text-sm">
          {[
            { label: "Cargo", value: contact.position ?? "No informado" },
            {
              label: "Teléfono",
              value: contact.phone ? (
                <a className="hover:underline" href={`tel:${contact.phone}`}>
                  {contact.phone}
                </a>
              ) : (
                "No informado"
              ),
            },
            {
              label: "Segundo teléfono",
              value: contact.second_phone ? (
                <a
                  className="hover:underline"
                  href={`tel:${contact.second_phone}`}
                >
                  {contact.second_phone}
                </a>
              ) : (
                "No informado"
              ),
            },
            {
              label: "Email",
              value: contact.email ? (
                <a className="hover:underline" href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              ) : (
                "No informado"
              ),
            },
            { label: "Alumnos solicitados", value: requestedStudentsTotal },
            {
              label: "Familias profesionales",
              value:
                families.length === 0 ? (
                  <span className="text-gray-400 dark:text-gray-500">
                    Sin familias
                  </span>
                ) : (
                  <ul className="flex flex-wrap gap-1">
                    {families.map((family) => (
                      <li
                        key={family.id}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs dark:bg-gray-800"
                      >
                        {family.code} · {family.name}
                      </li>
                    ))}
                  </ul>
                ),
            },
            { label: "Creado por", value: createdByLabel },
            { label: "Fecha de alta", value: createdAtLabel },
            { label: "Actualizado por", value: updatedByLabel },
            { label: "Fecha de actualización", value: updatedAtLabel },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex flex-col gap-1 px-4 py-3 md:flex-row md:gap-0"
            >
              <dt className="w-48 shrink-0 text-gray-500 dark:text-gray-400">
                {label}
              </dt>
              <dd className="font-medium text-gray-900 dark:text-gray-100 break-all">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </header>
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-950 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Interacciones relacionadas con Ciclos Formativos
          </h2>
          {canWrite ? (
            <CreateInteractionModal
              action={createAction}
              interactionTypes={INTERACTION_TYPE_OPTIONS_ES}
              autonomousCommunities={fpCenterFormOptions.autonomousCommunities}
              provinces={fpCenterFormOptions.provinces}
              fpCenters={fpCenterFormOptions.centers}
              families={
                tutorFamilyId
                  ? professionalFamilies.filter(
                      (family) => family.id === tutorFamilyId,
                    )
                  : professionalFamilies
              }
              ciclos={ciclos.map((ciclo) => ({
                id: ciclo.id,
                name: ciclo.name,
                professionalFamilyId: ciclo.professional_family_id,
                professionalFamilyCode: ciclo.professional_family_code,
                familyName: ciclo.professional_family_name,
              }))}
              openCicloIds={openCicloIds}
              title="Nueva interacción"
              submitLabel="Crear interacción"
              triggerLabel="+"
              triggerClassName="inline-flex items-center justify-center rounded-full bg-blue-600 text-white w-9 h-9 text-xl leading-none hover:bg-blue-700"
              mode="create"
            />
          ) : null}
        </div>

        {interactions.length === 0 ? (
          <p className="text-sm text-gray-500">
            No hay interacciones para este contacto.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Tipo
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Familias / Ciclos
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Ámbito
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Estado
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Alumnos
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Notas
                  </th>
                  <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((interaction) => {
                  const updateAction = updateInteractionForContact.bind(
                    null,
                    contact.id,
                    interaction.id,
                  );
                  const deleteAction = deleteInteractionForContact.bind(
                    null,
                    contact.id,
                    interaction.id,
                  );

                  const occurredAt = new Date(interaction.occurred_at);
                  const occurredAtLabel = Number.isNaN(occurredAt.getTime())
                    ? "—"
                    : occurredAt.toLocaleString("es-ES", {
                        dateStyle: "short",
                        timeStyle: "short",
                      });

                  return (
                    <tr
                      key={interaction.id}
                      className="border-t border-gray-200 dark:border-gray-700 align-top"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {occurredAtLabel}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {
                          INTERACTION_TYPE_OPTIONS_ES.find(
                            (option) => option.value === interaction.type,
                          )?.label
                        }
                      </td>
                      <td className="px-3 py-2">
                        {interaction.targets.length === 0 ? (
                          "Sin familias/ciclos"
                        ) : (
                          <ul className="space-y-1">
                            {interaction.targets.map((target, index) => (
                              <li key={`${interaction.id}-target-${index}`}>
                                {(target.professional_family
                                  ? `${target.professional_family.code} · ${target.professional_family.name}`
                                  : "Familia desconocida") +
                                  " → " +
                                  (target.ciclo_formativo?.name ??
                                    "Ciclo desconocido") +
                                  (target.fp_center
                                    ? ` · ${target.fp_center.name}`
                                    : "")}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {interaction.enterprise?.name
                          ? `Empresa: ${interaction.enterprise.name}`
                          : interaction.organization?.name
                            ? `Grupo: ${interaction.organization.name}`
                            : "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <InteractionStatusPill
                          status={interaction.status}
                          size="sm"
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {REQUESTED_STUDENTS_REQUIRED_STATUS_SET.has(
                          interaction.status,
                        )
                          ? (interaction.requested_students ?? 0)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 max-w-sm">
                        <p className="line-clamp-2 text-gray-700 dark:text-gray-200">
                          {interaction.notes ?? "—"}
                        </p>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end items-center gap-2">
                          {canWrite ? (
                            <CreateInteractionModal
                              action={updateAction}
                              interactionTypes={INTERACTION_TYPE_OPTIONS_ES}
                              autonomousCommunities={
                                fpCenterFormOptions.autonomousCommunities
                              }
                              provinces={fpCenterFormOptions.provinces}
                              fpCenters={fpCenterFormOptions.centers}
                              families={
                                tutorFamilyId
                                  ? professionalFamilies.filter(
                                      (family) => family.id === tutorFamilyId,
                                    )
                                  : professionalFamilies
                              }
                              ciclos={ciclos.map((ciclo) => ({
                                id: ciclo.id,
                                name: ciclo.name,
                                professionalFamilyId:
                                  ciclo.professional_family_id,
                                professionalFamilyCode:
                                  ciclo.professional_family_code,
                                familyName: ciclo.professional_family_name,
                              }))}
                              openCicloIds={openCicloIds}
                              title="Editar interacción"
                              submitLabel="Guardar cambios"
                              triggerLabel="✏"
                              triggerClassName="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-900"
                              mode="edit"
                              initialValues={{
                                type: interaction.type,
                                targets: interaction.targets,
                                occurred_at: interaction.occurred_at,
                                status: interaction.status,
                                notes: interaction.notes,
                                requested_students:
                                  interaction.requested_students,
                              }}
                            />
                          ) : null}
                          {canDelete ? (
                            <DeleteButton
                              action={deleteAction}
                              confirmMessage="¿Seguro que quieres eliminar esta interacción?"
                            />
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
