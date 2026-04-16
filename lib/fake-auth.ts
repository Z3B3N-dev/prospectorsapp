import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

export type FakeRole =
	| "admin"
	| "prospector_consejeria"
	| "prospector_centro"
	| "tutor";
export type FakeUsernameLocal =
	| "admin"
	| "prospector.consejeria"
	| "prospector.centro"
	| "tutor";

export const GOVERNMENT_EMAIL_DOMAIN = "gobiernodecanarias.org";

export type FakeAuthUser = {
	userId: string;
	username: string;
	role: FakeRole;
	canWrite: boolean;
	canDeleteAny: boolean;
	canDeleteOwn: boolean;
	canDelete: boolean;
	professionalFamilyId: string | null;
	professionalFamilyCode: string | null;
};

const SESSION_COOKIE = "prospectors_fake_session";

const CREDENTIALS: Record<
	FakeUsernameLocal,
	{
		password: string;
		role: FakeRole;
		userId: string;
		displayName: string;
		professionalFamilyCode?: string;
	}
> = {
	admin: {
		password: "admin1234",
		role: "admin",
		userId: "2f8d4639-b0a9-4ad5-a65b-cb7f9577f34f",
		displayName: "Administrador",
	},
	"prospector.consejeria": {
		password: "prospector1234",
		role: "prospector_consejeria",
		userId: "4e5523c9-f2ee-49c5-bcc2-ad18f932f7e1",
		displayName: "Prospector de la consejeria",
	},
	"prospector.centro": {
		password: "centro1234",
		role: "prospector_centro",
		userId: "1f8e2397-a80b-4686-a669-7be460a6e4c5",
		displayName: "Prospector del centro educativo",
	},
	tutor: {
		password: "tutor1234",
		role: "tutor",
		userId: "0f188ecb-e664-4ec4-ad8c-46ea075d6efb",
		displayName: "Tutor",
		professionalFamilyCode: "INF",
	},
};

function buildEmail(local: FakeUsernameLocal): string {
	return `${local}@${GOVERNMENT_EMAIL_DOMAIN}`;
}

export function resolveKnownFakeUserEmailById(
	userId: string | null,
): string | null {
	if (!userId) return null;

	for (const [local, credential] of Object.entries(CREDENTIALS) as Array<
		[FakeUsernameLocal, (typeof CREDENTIALS)[FakeUsernameLocal]]
	>) {
		if (credential.userId === userId) {
			return buildEmail(local);
		}
	}

	return null;
}

export function resolveKnownFakeUserNameById(
	userId: string | null,
): string | null {
	if (!userId) return null;

	for (const credential of Object.values(CREDENTIALS)) {
		if (credential.userId === userId) {
			return credential.displayName;
		}
	}

	return null;
}

function asNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function resolveDisplayNameFromProfile(
	profile: Record<string, unknown>,
): string | null {
	for (const key of [
		"full_name",
		"display_name",
		"name",
		"username",
		"email",
	]) {
		const value = asNonEmptyString(profile[key]);
		if (value) return value;
	}

	return null;
}

export async function resolveUserDisplayNamesByIds(
	userIds: Array<string | null | undefined>,
): Promise<Map<string, string>> {
	const ids = [...new Set(userIds.filter((id): id is string => !!id))];
	const labels = new Map<string, string>();

	for (const id of ids) {
		const knownName = resolveKnownFakeUserNameById(id);
		if (knownName) {
			labels.set(id, knownName);
			continue;
		}

		const knownEmail = resolveKnownFakeUserEmailById(id);
		if (knownEmail) labels.set(id, knownEmail);
	}

	let pendingIds = ids.filter((id) => !labels.has(id));
	if (pendingIds.length === 0) return labels;

	const supabase = await createClient();

	for (const lookupColumn of ["user_id", "id"] as const) {
		if (pendingIds.length === 0) break;

		const { data, error } = await supabase
			.from("profiles")
			.select("*")
			.in(lookupColumn, pendingIds);

		if (error || !data?.length) continue;

		for (const profile of data as Record<string, unknown>[]) {
			const resolvedId = asNonEmptyString(profile[lookupColumn]);
			if (!resolvedId || labels.has(resolvedId)) continue;
			if (!pendingIds.includes(resolvedId)) continue;

			const name = resolveDisplayNameFromProfile(profile);
			if (!name) continue;

			labels.set(resolvedId, name);
		}

		pendingIds = pendingIds.filter((id) => !labels.has(id));
	}

	return labels;
}

function toFakeUsernameLocal(value: string): FakeUsernameLocal | null {
	const normalizedValue = value.trim().toLowerCase();
	const domainSuffix = `@${GOVERNMENT_EMAIL_DOMAIN}`;

	if (!normalizedValue.endsWith(domainSuffix)) {
		return null;
	}

	const local = normalizedValue.slice(0, -domainSuffix.length);
	if (local === "admin") return "admin";
	if (local === "prospector.consejeria") return "prospector.consejeria";
	if (local === "prospector.centro") return "prospector.centro";
	if (local === "tutor") return "tutor";

	return null;
}

function isFakeUsernameLocal(value: string): value is FakeUsernameLocal {
	return value in CREDENTIALS;
}

async function resolveProfessionalFamilyId(
	preferredCode?: string,
): Promise<{ id: string; code: string } | null> {
	const supabase = await createClient();

	if (preferredCode) {
		const { data: byCode, error: byCodeError } = await supabase
			.from("professional_family")
			.select("id, code")
			.eq("code", preferredCode)
			.limit(1)
			.maybeSingle();

		if (byCodeError) throw new Error(byCodeError.message);
		if (byCode) {
			return { id: byCode.id as string, code: byCode.code as string };
		}
	}

	const { data: fallback, error: fallbackError } = await supabase
		.from("professional_family")
		.select("id, code")
		.order("code")
		.limit(1)
		.maybeSingle();

	if (fallbackError) throw new Error(fallbackError.message);
	if (!fallback) return null;

	return { id: fallback.id as string, code: fallback.code as string };
}

async function resolvePersistableUserId(
	preferredUserId: string,
): Promise<string> {
	const supabase = await createClient();

	const { data: preferred, error: preferredError } = await supabase
		.from("profiles")
		.select("user_id")
		.eq("user_id", preferredUserId)
		.limit(1)
		.maybeSingle();

	if (preferredError) throw new Error(preferredError.message);
	if (preferred?.user_id) return preferred.user_id as string;

	const { data: fallback, error: fallbackError } = await supabase
		.from("profiles")
		.select("user_id")
		.limit(1)
		.maybeSingle();

	if (fallbackError) throw new Error(fallbackError.message);
	if (fallback?.user_id) return fallback.user_id as string;

	return preferredUserId;
}

async function toUser(usernameLocal: FakeUsernameLocal): Promise<FakeAuthUser> {
	const credential = CREDENTIALS[usernameLocal];
	const role = credential.role;
	const persistedUserId = await resolvePersistableUserId(credential.userId);
	const preferredFamilyCode = credential.professionalFamilyCode;
	const family =
		role === "tutor"
			? await resolveProfessionalFamilyId(preferredFamilyCode)
			: null;
	const canWrite = role === "admin" || role === "prospector_consejeria";
	const canDeleteAny = role === "admin";
	const canDeleteOwn = role === "prospector_consejeria";

	return {
		userId: persistedUserId,
		username: buildEmail(usernameLocal),
		role,
		canWrite,
		canDeleteAny,
		canDeleteOwn,
		canDelete: canDeleteAny || canDeleteOwn,
		professionalFamilyId: family?.id ?? null,
		professionalFamilyCode: family?.code ?? null,
	};
}

export async function signInFakeUser(username: string, password: string) {
	const usernameLocal = toFakeUsernameLocal(username);
	if (!usernameLocal) {
		return { ok: false as const, message: "Credenciales inválidas" };
	}

	const credential = CREDENTIALS[usernameLocal];

	if (!credential || credential.password !== password) {
		return { ok: false as const, message: "Credenciales inválidas" };
	}

	const cookieStore = await cookies();
	cookieStore.set(SESSION_COOKIE, usernameLocal, {
		httpOnly: true,
		sameSite: "lax",
		path: "/",
	});

	return {
		ok: true as const,
		user: await toUser(usernameLocal),
	};
}

export async function signOutFakeUser() {
	const cookieStore = await cookies();
	cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentFakeUser(): Promise<FakeAuthUser | null> {
	const cookieStore = await cookies();
	const value = cookieStore.get(SESSION_COOKIE)?.value;
	if (!value) return null;
	if (!isFakeUsernameLocal(value)) return null;
	return toUser(value);
}

export async function requireFakeUser(): Promise<FakeAuthUser> {
	const user = await getCurrentFakeUser();
	if (!user) {
		throw new Error("Inicia sesión para continuar");
	}
	return user;
}

export async function requireDeletePermission() {
	const user = await requireFakeUser();
	if (!user.canDelete) {
		throw new Error("No tienes permisos para eliminar");
	}
	return user;
}

export async function requireWritePermission() {
	const user = await requireFakeUser();
	if (!user.canWrite) {
		throw new Error("No tienes permisos para editar");
	}
	return user;
}

export function canDeleteRecordByCreator(
	user: FakeAuthUser,
	createdBy: string | null,
) {
	if (user.canDeleteAny) return true;
	if (!user.canDeleteOwn) return false;
	return !!createdBy && createdBy === user.userId;
}
