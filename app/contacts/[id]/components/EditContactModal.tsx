"use client";

import { useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import type { Contact } from "@/lib/contacts/types";
import type {
  EnterpriseOption,
  OrganizationOption,
} from "@/lib/contacts/ui-types";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initialValues: Pick<
    Contact,
    | "name"
    | "position"
    | "phone"
    | "second_phone"
    | "email"
    | "organization"
    | "enterprise"
  >;
  organizationOptions: OrganizationOption[];
  enterpriseOptions: EnterpriseOption[];
};

export function EditContactModal({
  action,
  initialValues,
  organizationOptions,
  enterpriseOptions,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [organizationId, setOrganizationId] = useState<string | null>(
    initialValues.organization?.id ?? null,
  );
  const [enterpriseId, setEnterpriseId] = useState<string | null>(
    initialValues.enterprise?.id ?? null,
  );

  const selectedEnterprise = useMemo(
    () =>
      enterpriseId
        ? (enterpriseOptions.find(
            (enterprise) => enterprise.id === enterpriseId,
          ) ?? null)
        : null,
    [enterpriseId, enterpriseOptions],
  );

  const isOrganizationLockedByEnterprise = selectedEnterprise !== null;

  const filteredEnterpriseOptions = useMemo(() => {
    if (!organizationId) return enterpriseOptions;
    return enterpriseOptions.filter(
      (enterprise) => enterprise.organizationId === organizationId,
    );
  }, [enterpriseOptions, organizationId]);

  function openModal() {
    setError(null);
    setOrganizationId(initialValues.organization?.id ?? null);
    setEnterpriseId(initialValues.enterprise?.id ?? null);
    setIsOpen(true);
  }

  function handleOrganizationChange(nextOrganizationId: string | null) {
    setOrganizationId(nextOrganizationId);
    if (!enterpriseId) return;

    const currentEnterprise = enterpriseOptions.find(
      (enterprise) => enterprise.id === enterpriseId,
    );
    if (!currentEnterprise) {
      setEnterpriseId(null);
      return;
    }

    if (currentEnterprise.organizationId !== nextOrganizationId) {
      setEnterpriseId(null);
    }
  }

  function handleEnterpriseChange(nextEnterpriseId: string | null) {
    setEnterpriseId(nextEnterpriseId);
    if (!nextEnterpriseId) return;

    const nextEnterprise = enterpriseOptions.find(
      (enterprise) => enterprise.id === nextEnterpriseId,
    );
    if (!nextEnterprise) {
      setOrganizationId(null);
      return;
    }

    setOrganizationId(nextEnterprise.organizationId ?? null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        setIsOpen(false);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No se pudo actualizar el contacto.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="rounded-md border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900"
      >
        Editar contacto
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Editar contacto</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {isOrganizationLockedByEnterprise ? (
                <input
                  type="hidden"
                  name="organization_id"
                  value={organizationId ?? ""}
                />
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm space-y-1 md:col-span-2">
                  <span>Nombre</span>
                  <input
                    name="name"
                    required
                    defaultValue={initialValues.name ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Cargo</span>
                  <input
                    name="position"
                    defaultValue={initialValues.position ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Teléfono</span>
                  <input
                    name="phone"
                    defaultValue={initialValues.phone ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Segundo teléfono</span>
                  <input
                    name="second_phone"
                    defaultValue={initialValues.second_phone ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1 md:col-span-2">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={initialValues.email ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Grupo empresarial</span>
                  <select
                    name="organization_id"
                    value={organizationId ?? ""}
                    onChange={(event) =>
                      handleOrganizationChange(
                        event.target.value.trim() || null,
                      )
                    }
                    disabled={isPending || isOrganizationLockedByEnterprise}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 disabled:opacity-60"
                  >
                    <option value="">Sin grupo empresarial</option>
                    {organizationOptions.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name ?? "(Sin nombre)"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Si eliges Empresa, este campo se ajusta automáticamente al
                    grupo padre.
                  </p>
                </label>

                <label className="text-sm space-y-1">
                  <span>Empresa</span>
                  <select
                    name="enterprise_id"
                    value={enterpriseId ?? ""}
                    onChange={(event) =>
                      handleEnterpriseChange(event.target.value.trim() || null)
                    }
                    disabled={isPending}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  >
                    <option value="">Sin empresa</option>
                    {filteredEnterpriseOptions.map((enterprise) => (
                      <option key={enterprise.id} value={enterprise.id}>
                        {enterprise.name ?? "(Sin nombre)"}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Si seleccionas Grupo empresarial, solo verás empresas de ese
                    grupo.
                  </p>
                </label>
              </div>

              {error ? (
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
                >
                  {isPending ? "Guardando..." : "Guardar cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
