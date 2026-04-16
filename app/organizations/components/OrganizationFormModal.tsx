"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { OrganizationDetail } from "@/lib/organizations/api";

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  initialValues?: Pick<
    OrganizationDetail,
    "name" | "address" | "city" | "province" | "phone" | "email"
  >;
  mode: "create" | "edit";
  triggerLabel: string;
  title: string;
  submitLabel: string;
  triggerClassName?: string;
};

export function OrganizationFormModal({
  action,
  initialValues,
  mode,
  triggerLabel,
  title,
  submitLabel,
  triggerClassName,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openModal() {
    setError(null);
    setIsOpen(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        await action(formData);
        setIsOpen(false);
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : mode === "create"
              ? "No se pudo crear el grupo empresarial."
              : "No se pudo actualizar el grupo empresarial.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          triggerClassName ??
          "rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
        }
      >
        {triggerLabel}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{title}</h3>
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
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-sm space-y-1 md:col-span-2">
                  <span>Nombre</span>
                  <input
                    name="name"
                    required
                    defaultValue={initialValues?.name ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1 md:col-span-2">
                  <span>Dirección</span>
                  <input
                    name="address"
                    defaultValue={initialValues?.address ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Ciudad</span>
                  <input
                    name="city"
                    defaultValue={initialValues?.city ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Provincia</span>
                  <input
                    name="province"
                    defaultValue={initialValues?.province ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Teléfono</span>
                  <input
                    name="phone"
                    defaultValue={initialValues?.phone ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>

                <label className="text-sm space-y-1">
                  <span>Email</span>
                  <input
                    name="email"
                    type="email"
                    defaultValue={initialValues?.email ?? ""}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                  />
                </label>
              </div>

              {error ? (
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              ) : null}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
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
