"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { INTERACTION_STATUS_OPTIONS_ES } from "@/lib/contacts/labels.es";
import type { CicloFormativo, InteractionStatus } from "@/lib/contacts/types";
import type { ProfessionalFamily } from "@/lib/professional-families/types";

type Props = {
  families: ProfessionalFamily[];
  ciclos: CicloFormativo[];
  activeFamilyId: string | null;
  activeCicloId: string | null;
  activeSearchQuery: string;
  activeStatus: InteractionStatus | null;
  lockFamilySelection?: boolean;
};

export function ContactsFilters({
  families,
  ciclos,
  activeFamilyId,
  activeCicloId,
  activeSearchQuery,
  activeStatus,
  lockFamilySelection = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(activeSearchQuery);

  useEffect(() => {
    setSearchValue(activeSearchQuery);
  }, [activeSearchQuery]);

  const pushSearchQuery = useCallback(
    (rawValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmedSearch = rawValue.trim();
      const currentSearch = activeSearchQuery.trim();

      if (trimmedSearch === currentSearch) return;

      if (trimmedSearch) {
        params.set("q", trimmedSearch);
      } else {
        params.delete("q");
      }

      router.push(`/contacts?${params.toString()}`);
    },
    [activeSearchQuery, router, searchParams],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      pushSearchQuery(searchValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, pushSearchQuery]);

  function handleFamilyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("family", e.target.value);
      params.delete("ciclo");
    } else {
      params.delete("family");
      params.delete("ciclo");
    }
    if (lockFamilySelection) {
      return;
    }

    router.push(`/contacts?${params.toString()}`);
  }

  function handleCicloChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("ciclo", e.target.value);
    } else {
      params.delete("ciclo");
    }
    router.push(`/contacts?${params.toString()}`);
  }

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("status", e.target.value);
    } else {
      params.delete("status");
    }
    router.push(`/contacts?${params.toString()}`);
  }

  function handleClear() {
    if (lockFamilySelection && activeFamilyId) {
      router.push(`/contacts?family=${activeFamilyId}`);
      return;
    }

    router.push("/contacts");
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pushSearchQuery(searchValue);
  }

  const isFiltered =
    !!activeFamilyId ||
    !!activeCicloId ||
    !!activeSearchQuery ||
    !!activeStatus;

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder="Buscar por contacto, empresa o grupo empresarial"
          className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={activeFamilyId ?? ""}
          onChange={handleFamilyChange}
          disabled={lockFamilySelection}
          className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">
            {lockFamilySelection
              ? "Familia profesional asignada"
              : "Todas las familias profesionales"}
          </option>
          {families.map((f) => (
            <option key={f.id} value={f.id}>
              {f.code} — {f.name}
            </option>
          ))}
        </select>

        <select
          value={activeStatus ?? ""}
          onChange={handleStatusChange}
          className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los estados</option>
          {INTERACTION_STATUS_OPTIONS_ES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <select
          value={activeCicloId ?? ""}
          onChange={handleCicloChange}
          disabled={!activeFamilyId}
          className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Todos los ciclos</option>
          {ciclos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
