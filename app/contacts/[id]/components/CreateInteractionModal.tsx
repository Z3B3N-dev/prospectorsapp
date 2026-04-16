"use client";

import { useTransition } from "react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { nowAsDatetimeLocal, toDatetimeLocal } from "@/lib/contacts/datetime";
import { INTERACTION_STATUS_OPTIONS_ES } from "@/lib/contacts/labels.es";
import type { Interaction, InteractionStatus } from "@/lib/contacts/types";
import type {
  AutonomousCommunityOption,
  CicloOption,
  FpCenterOption,
  InteractionTypeOption,
  ProvinceOption,
} from "@/lib/contacts/ui-types";
import type { ProfessionalFamily } from "@/lib/professional-families/types";

type InteractionTargetRow = {
  id: string;
  autonomousCommunityId: string;
  provinceId: string;
  fpCenterId: string;
  familyId: string;
  cicloId: string;
};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  interactionTypes: InteractionTypeOption[];
  autonomousCommunities: AutonomousCommunityOption[];
  provinces: ProvinceOption[];
  fpCenters: FpCenterOption[];
  families: ProfessionalFamily[];
  ciclos: CicloOption[];
  openCicloIds?: string[];
  title: string;
  submitLabel: string;
  triggerLabel: string;
  triggerClassName: string;
  initialValues?: Pick<
    Interaction,
    | "type"
    | "targets"
    | "occurred_at"
    | "status"
    | "notes"
    | "requested_students"
  >;
  mode: "create" | "edit";
};

export function CreateInteractionModal({
  action,
  interactionTypes,
  autonomousCommunities,
  provinces,
  fpCenters,
  families,
  ciclos,
  openCicloIds = [],
  title,
  submitLabel,
  triggerLabel,
  triggerClassName,
  initialValues,
  mode,
}: Props) {
  const fixedAutonomousCommunityId =
    autonomousCommunities.find((community) => community.code === "CN")?.id ??
    autonomousCommunities[0]?.id ??
    "";
  const openCicloSet = useMemo(() => new Set(openCicloIds), [openCicloIds]);
  const cicloById = useMemo(() => {
    const map = new Map<string, CicloOption>();
    for (const ciclo of ciclos) map.set(ciclo.id, ciclo);
    return map;
  }, [ciclos]);
  const familyById = useMemo(() => {
    const map = new Map<string, ProfessionalFamily>();
    for (const family of families) map.set(family.id, family);
    return map;
  }, [families]);
  const centerById = useMemo(() => {
    const map = new Map<string, FpCenterOption>();
    for (const center of fpCenters) map.set(center.id, center);
    return map;
  }, [fpCenters]);

  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<InteractionStatus>(
    initialValues?.status ?? "unknown",
  );
  const [targetRows, setTargetRows] = useState<InteractionTargetRow[]>(() =>
    buildInitialRows(initialValues, fixedAutonomousCommunityId),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const defaultDate = useMemo(() => nowAsDatetimeLocal(), []);
  const defaultOccurredAt = initialValues?.occurred_at
    ? toDatetimeLocal(initialValues.occurred_at)
    : defaultDate;

  const defaultRequestedStudents =
    initialValues?.requested_students !== null &&
    initialValues?.requested_students !== undefined
      ? String(initialValues.requested_students)
      : "";

  function openModal() {
    setStatus(initialValues?.status ?? "unknown");
    setTargetRows(buildInitialRows(initialValues, fixedAutonomousCommunityId));
    setError(null);
    setIsOpen(true);
  }

  function addTargetRow() {
    setTargetRows((prev) => [
      ...prev,
      createEmptyRow(fixedAutonomousCommunityId),
    ]);
  }

  function removeTargetRow(rowId: string) {
    setTargetRows((prev) => prev.filter((row) => row.id !== rowId));
  }

  function updateTargetFamily(rowId: string, familyId: string) {
    setTargetRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (!familyId) {
          return { ...row, familyId: "", cicloId: "", fpCenterId: "" };
        }

        const ciclo = row.cicloId ? cicloById.get(row.cicloId) : null;
        const center = row.fpCenterId ? centerById.get(row.fpCenterId) : null;
        const keepCiclo = !ciclo || ciclo.professionalFamilyId === familyId;
        const keepCenter =
          !center || center.professionalFamilyIds.includes(familyId);

        return {
          ...row,
          familyId,
          cicloId: keepCiclo ? row.cicloId : "",
          fpCenterId: keepCenter ? row.fpCenterId : "",
        };
      }),
    );
  }

  function updateTargetAutonomousCommunity(
    rowId: string,
    autonomousCommunityId: string,
  ) {
    setTargetRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (!autonomousCommunityId) {
          return {
            ...row,
            autonomousCommunityId: "",
            provinceId: "",
            fpCenterId: "",
          };
        }

        if (row.autonomousCommunityId === autonomousCommunityId) {
          return row;
        }

        return {
          ...row,
          autonomousCommunityId,
          provinceId: "",
          fpCenterId: "",
        };
      }),
    );
  }

  function updateTargetProvince(rowId: string, provinceId: string) {
    setTargetRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (!provinceId) {
          return { ...row, provinceId: "", fpCenterId: "" };
        }

        if (row.provinceId === provinceId) {
          return row;
        }

        return { ...row, provinceId, fpCenterId: "" };
      }),
    );
  }

  function updateTargetCenter(rowId: string, fpCenterId: string) {
    setTargetRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (!fpCenterId) return { ...row, fpCenterId: "" };

        const center = centerById.get(fpCenterId);
        if (!center) {
          return { ...row, fpCenterId: "" };
        }

        return {
          ...row,
          fpCenterId,
          autonomousCommunityId: center.autonomousCommunityId,
          provinceId: center.provinceId,
        };
      }),
    );
  }

  function updateTargetCiclo(rowId: string, cicloId: string) {
    setTargetRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        if (!cicloId) return { ...row, cicloId: "" };

        const ciclo = cicloById.get(cicloId);
        if (!ciclo) {
          return { ...row, cicloId: "" };
        }

        return {
          ...row,
          cicloId,
          familyId: row.familyId || ciclo.professionalFamilyId,
        };
      }),
    );
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
            : "No se pudo guardar la interacción.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={triggerClassName}
        aria-label={triggerLabel}
        title={triggerLabel}
      >
        {triggerLabel}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-gray-300 dark:border-gray-700 px-2 py-1 text-sm"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-sm space-y-1">
                  <span>Tipo</span>
                  <select
                    name="type"
                    required
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                    defaultValue={initialValues?.type ?? "call"}
                  >
                    {interactionTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="text-sm space-y-2 md:col-span-3">
                  <div className="flex items-center justify-between">
                    <span>Familias y ciclos relacionados a la interacción</span>
                    <button
                      type="button"
                      onClick={addTargetRow}
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-900"
                    >
                      Añadir
                    </button>
                  </div>

                  {targetRows.length === 0 ? (
                    <p className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 dark:border-gray-700">
                      Sin familias/ciclos para esta interacción.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-900/80">
                          <tr>
                            <th className="px-2 py-1 text-left">Familia</th>
                            <th className="px-2 py-1 text-left">Ciclo</th>
                            <th className="px-2 py-1 text-left">Comunidad</th>
                            <th className="px-2 py-1 text-left">Provincia</th>
                            <th className="px-2 py-1 text-left">Centro FP</th>
                            <th className="px-2 py-1 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {targetRows.map((row) => {
                            const hasFamilyAndCiclo = Boolean(
                              row.familyId && row.cicloId,
                            );
                            const visibleProvinces = row.autonomousCommunityId
                              ? provinces.filter(
                                  (province) =>
                                    province.autonomousCommunityId ===
                                    row.autonomousCommunityId,
                                )
                              : [];

                            const visibleCenters =
                              hasFamilyAndCiclo && row.provinceId
                                ? fpCenters.filter(
                                    (center) =>
                                      center.provinceId === row.provinceId &&
                                      center.professionalFamilyIds.includes(
                                        row.familyId,
                                      ),
                                  )
                                : [];

                            const visibleCiclos = row.familyId
                              ? ciclos.filter(
                                  (ciclo) =>
                                    ciclo.professionalFamilyId === row.familyId,
                                )
                              : ciclos;
                            return (
                              <tr
                                key={row.id}
                                className="border-t border-gray-200 dark:border-gray-700"
                              >
                                <td className="px-2 py-1 align-top">
                                  <input
                                    type="hidden"
                                    name="target_family_id[]"
                                    value={row.familyId}
                                  />
                                  <select
                                    value={row.familyId}
                                    onChange={(event) =>
                                      updateTargetFamily(
                                        row.id,
                                        event.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                                  >
                                    <option value="">Desconocido</option>
                                    {families.map((family) => (
                                      <option key={family.id} value={family.id}>
                                        {family.code} · {family.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <input
                                    type="hidden"
                                    name="target_ciclo_id[]"
                                    value={row.cicloId}
                                  />
                                  <select
                                    value={row.cicloId}
                                    onChange={(event) =>
                                      updateTargetCiclo(
                                        row.id,
                                        event.target.value,
                                      )
                                    }
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                                  >
                                    <option value="">Desconocido</option>
                                    {visibleCiclos.map((ciclo) => {
                                      const disabledInCreateMode =
                                        mode === "create" &&
                                        openCicloSet.has(ciclo.id);
                                      return (
                                        <option
                                          key={ciclo.id}
                                          value={ciclo.id}
                                          disabled={disabledInCreateMode}
                                        >
                                          {ciclo.name}
                                          {ciclo.familyName
                                            ? ` · ${ciclo.familyName}`
                                            : ""}
                                          {disabledInCreateMode
                                            ? " (interacción abierta)"
                                            : ""}
                                        </option>
                                      );
                                    })}
                                  </select>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <input
                                    type="hidden"
                                    name="target_autonomous_community_id[]"
                                    value={row.autonomousCommunityId}
                                  />
                                  <select
                                    value={row.autonomousCommunityId}
                                    onChange={(event) =>
                                      updateTargetAutonomousCommunity(
                                        row.id,
                                        event.target.value,
                                      )
                                    }
                                    disabled
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-900"
                                  >
                                    {autonomousCommunities.map((community) => (
                                      <option
                                        key={community.id}
                                        value={community.id}
                                      >
                                        {community.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <input
                                    type="hidden"
                                    name="target_province_id[]"
                                    value={row.provinceId}
                                  />
                                  <select
                                    value={row.provinceId}
                                    onChange={(event) =>
                                      updateTargetProvince(
                                        row.id,
                                        event.target.value,
                                      )
                                    }
                                    disabled={
                                      !hasFamilyAndCiclo ||
                                      !row.autonomousCommunityId
                                    }
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                                  >
                                    <option value="">Desconocido</option>
                                    {visibleProvinces.map((province) => (
                                      <option
                                        key={province.id}
                                        value={province.id}
                                      >
                                        {province.name}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1 align-top">
                                  <input
                                    type="hidden"
                                    name="target_fp_center_id[]"
                                    value={row.fpCenterId}
                                  />
                                  <select
                                    value={row.fpCenterId}
                                    onChange={(event) =>
                                      updateTargetCenter(
                                        row.id,
                                        event.target.value,
                                      )
                                    }
                                    disabled={
                                      !hasFamilyAndCiclo || !row.provinceId
                                    }
                                    className="w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                                  >
                                    <option value="">Desconocido</option>
                                    {visibleCenters.map((center) => (
                                      <option key={center.id} value={center.id}>
                                        {center.name} ({center.code})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-1 text-right align-top">
                                  <button
                                    type="button"
                                    onClick={() => removeTargetRow(row.id)}
                                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                                  >
                                    Quitar
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {targetRows.some(
                    (row) => row.familyId && !familyById.has(row.familyId),
                  ) ? (
                    <p className="text-xs text-red-700 dark:text-red-300">
                      Hay familias no válidas en la selección.
                    </p>
                  ) : null}
                </div>

                <label className="text-sm space-y-1 md:col-span-3">
                  <span>Fecha y hora</span>
                  <input
                    type="datetime-local"
                    name="occurred_at"
                    defaultValue={defaultOccurredAt}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1 md:col-span-3">
                  <span>Estado</span>
                  <select
                    name="status"
                    defaultValue={initialValues?.status ?? "unknown"}
                    onChange={(event) =>
                      setStatus(event.target.value as InteractionStatus)
                    }
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  >
                    {INTERACTION_STATUS_OPTIONS_ES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {status === "agreement_reached" || status === "hired" ? (
                  <label className="text-sm space-y-1 md:col-span-3">
                    <span>Alumnos solicitados</span>
                    <input
                      type="number"
                      name="requested_students"
                      min={1}
                      step={1}
                      required
                      defaultValue={defaultRequestedStudents}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                    />
                  </label>
                ) : null}
              </div>

              <label className="text-sm space-y-1 block">
                <span>Notas</span>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={initialValues?.notes ?? ""}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  placeholder="Detalle de la interaccion"
                />
              </label>

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
                  {isPending ? "Guardando..." : submitLabel}
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

function createEmptyRow(
  fixedAutonomousCommunityId: string,
): InteractionTargetRow {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    autonomousCommunityId: fixedAutonomousCommunityId,
    provinceId: "",
    fpCenterId: "",
    familyId: "",
    cicloId: "",
  };
}

function buildInitialRows(
  initialValues?: Pick<
    Interaction,
    | "type"
    | "targets"
    | "occurred_at"
    | "status"
    | "notes"
    | "requested_students"
  >,
  fixedAutonomousCommunityId: string = "",
): InteractionTargetRow[] {
  const fromTargets =
    initialValues?.targets.map((target) => ({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      autonomousCommunityId:
        target.autonomous_community_id ?? fixedAutonomousCommunityId,
      provinceId: target.province_id ?? "",
      fpCenterId: target.fp_center_id ?? "",
      familyId: target.professional_family_id ?? "",
      cicloId: target.ciclo_formativo_id ?? "",
    })) ?? [];

  return fromTargets;
}
