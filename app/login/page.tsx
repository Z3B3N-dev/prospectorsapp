import Link from "next/link";
import { getCurrentFakeUser } from "@/lib/fake-auth";
import { loginAction, logoutAction } from "./actions";

type SearchParams = Promise<{ error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const user = await getCurrentFakeUser();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Acceso</h1>
          <p className="text-sm text-gray-500">
            Acceso de prueba para desarrollo local
          </p>
        </div>

        {user ? (
          <div className="space-y-3">
            <p className="text-sm">
              Sesión activa:{" "}
              <span className="font-semibold">{user.username}</span> (
              {user.role})
            </p>
            <div className="flex gap-2">
              <Link
                href="/contacts"
                className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
              >
                Ir a Contactos
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm"
                >
                  Cerrar sesión
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form action={loginAction} className="space-y-3">
            <label className="block text-sm space-y-1">
              <span>Usuario</span>
              <input
                name="username"
                type="email"
                required
                placeholder="nombre@gobiernodecanarias.org"
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
              />
            </label>

            <label className="block text-sm space-y-1">
              <span>Contraseña</span>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black"
            >
              Iniciar sesión
            </button>

            {params.error ? (
              <p className="text-sm text-red-600">{params.error}</p>
            ) : null}

            <div className="text-xs text-gray-500 pt-2">
              <p>admin@gobiernodecanarias.org / admin1234 (acceso total)</p>
              <p>
                prospector.consejeria@gobiernodecanarias.org / prospector1234
                (edita todo y borra solo lo que crea)
              </p>
              <p>
                prospector.centro@gobiernodecanarias.org / centro1234 (solo
                lectura)
              </p>
              <p>
                tutor@gobiernodecanarias.org / tutor1234 (solo contactos de su
                familia)
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
