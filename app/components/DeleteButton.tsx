"use client";

import { useState, useTransition } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  confirmMessage: string;
  label?: string;
};

export function DeleteButton({
  action,
  confirmMessage,
  label = "Eliminar",
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!confirm(confirmMessage)) return;

    setError(null);
    startTransition(async () => {
      try {
        await action(new FormData());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ha ocurrido un error inesperado.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 px-3 py-1.5 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Eliminando…" : label}
        </button>
      </form>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
