"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  basePath: string;
  activeQuery: string;
  placeholder?: string;
};

export function NameSearchInput({
  basePath,
  activeQuery,
  placeholder = "Buscar por nombre...",
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(activeQuery);

  useEffect(() => {
    setValue(activeQuery);
  }, [activeQuery]);

  const pushSearchQuery = useCallback(
    (rawValue: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = rawValue.trim();
      const current = activeQuery.trim();

      if (trimmed === current) return;

      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      router.push(`${basePath}?${params.toString()}`);
    },
    [activeQuery, basePath, router, searchParams],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      pushSearchQuery(value);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, pushSearchQuery]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    pushSearchQuery(value);
  }

  function handleClear() {
    setValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black"
      >
        Buscar
      </button>
      {activeQuery ? (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 underline whitespace-nowrap"
        >
          Limpiar
        </button>
      ) : null}
    </form>
  );
}
