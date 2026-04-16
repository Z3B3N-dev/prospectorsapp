import type { Contact, ContactWithFamilies } from "./types";
import type { ProfessionalFamily } from "../professional-families/types";

type RawEnterprise = { id: string; name: string | null };
type RawOrganization = { id: string; name: string | null };

function asSingleRelation<T>(value: T | T[] | null): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

type RawContact = {
	id: string;
	name: string | null;
	position: string | null;
	phone: string | null;
	second_phone?: string | null;
	email: string | null;
	created_at?: string | null;
	created_by?: string | null;
	updated_at?: string | null;
	updated_by?: string | null;
	organization: RawOrganization | RawOrganization[] | null;
	// Supabase returns embedded FK as single object at runtime but infers array type without codegen
	enterprise: RawEnterprise | RawEnterprise[] | null;
};

export function mapContact(raw: RawContact): Contact {
	return {
		id: raw.id,
		name: raw.name ?? null,
		position: raw.position ?? null,
		phone: raw.phone ?? null,
		second_phone: raw.second_phone ?? null,
		email: raw.email ?? null,
		created_at: raw.created_at ?? null,
		created_by: raw.created_by ?? null,
		updated_at: raw.updated_at ?? null,
		updated_by: raw.updated_by ?? null,
		organization: (() => {
			const o = asSingleRelation(raw.organization);
			return o ? { id: o.id, name: o.name ?? null } : null;
		})(),
		enterprise: (() => {
			const e = asSingleRelation(raw.enterprise);
			return e ? { id: e.id, name: e.name ?? null } : null;
		})(),
	};
}

type RawContactFamilyRow = {
	contact_id: string;
	professional_family:
		| { id: string; code: string; name: string }
		| { id: string; code: string; name: string }[]
		| null;
};

export function mapContactFamilies(
	rows: RawContactFamilyRow[],
): Map<string, ProfessionalFamily[]> {
	const map = new Map<string, ProfessionalFamily[]>();
	for (const row of rows) {
		const family = Array.isArray(row.professional_family)
			? row.professional_family[0]
			: row.professional_family;
		if (!family) continue;
		const existing = map.get(row.contact_id) ?? [];
		existing.push(family);
		map.set(row.contact_id, existing);
	}
	return map;
}

export function mapContactWithFamilies(
	raw: RawContact,
	families: ProfessionalFamily[],
): ContactWithFamilies {
	return {
		...mapContact(raw),
		families,
	};
}
