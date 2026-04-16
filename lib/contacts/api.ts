import type { SupabaseClient } from "@supabase/supabase-js";

import type { ProfessionalFamily } from "../professional-families/types";
import { createClient } from "../supabase/server";
import { mapContact } from "./mappers";
import type {
	Contact,
	ContactCicloEntry,
	ContactFamilyLink,
	ContactFilters,
	ContactInteractionSummary,
	CicloFormativo,
	Interaction,
	InteractionStatus,
} from "./types";
import { REQUESTED_STUDENTS_REQUIRED_STATUS_SET } from "./constants";

// Returns the contact IDs that have interactions with ciclos in the given families.
// Returns null when no filter is requested (= "all contacts").
async function getContactIdsByFamilies(
	supabase: SupabaseClient,
	familyIds: string[],
): Promise<string[] | null> {
	const { data, error } = await supabase
		.from("interactions")
		.select("contact_id,interaction_targets(professional_family_id)")
		.not("contact_id", "is", null);

	if (error) throw error;
	if (!data || data.length === 0) return [];

	const familyIdSet = new Set(familyIds);
	const matches = new Set<string>();
	for (const row of data) {
		const contactId = row.contact_id as string | null;
		if (!contactId) continue;

		const hasFamily = (
			(row.interaction_targets as
				| Array<{ professional_family_id: string | null }>
				| null
				| undefined) ?? []
		).some(
			(target) =>
				target.professional_family_id !== null &&
				familyIdSet.has(target.professional_family_id),
		);

		if (hasFamily) matches.add(contactId);
	}

	return [...matches];
}

async function getContactIdsByCiclo(
	supabase: SupabaseClient,
	cicloId: string,
): Promise<string[] | null> {
	if (!cicloId) return null;

	const { data, error } = await supabase
		.from("interactions")
		.select("contact_id,interaction_targets(ciclo_formativo_id)")
		.not("contact_id", "is", null);

	if (error) throw error;
	if (!data?.length) return [];

	const matches = new Set<string>();
	for (const row of data) {
		const contactId = row.contact_id as string | null;
		if (!contactId) continue;

		const hasCiclo = (
			(row.interaction_targets as
				| Array<{ ciclo_formativo_id: string | null }>
				| null
				| undefined) ?? []
		).some((target) => target.ciclo_formativo_id === cicloId);

		if (hasCiclo) matches.add(contactId);
	}

	return [...matches];
}

async function getContactIdsByForeignKey(
	supabase: SupabaseClient,
	column: "enterprise_id" | "organization_id",
	ids: string[],
): Promise<string[]> {
	if (ids.length === 0) return [];

	const { data, error } = await supabase
		.from("contacts")
		.select("id")
		.in(column, ids)
		.or("is_deleted.eq.false,is_deleted.is.null");

	if (error) throw error;
	return [...new Set((data ?? []).map((row) => row.id as string))];
}

async function getContactIdsBySearch(
	supabase: SupabaseClient,
	search: string,
): Promise<string[] | null> {
	const trimmedSearch = search.trim();
	if (!trimmedSearch) return null;

	const pattern = `%${trimmedSearch}%`;
	const [
		{ data: contactsByName, error: contactsError },
		{ data: enterpriseMatches, error: enterpriseError },
		{ data: organizationMatches, error: organizationError },
	] = await Promise.all([
		supabase
			.from("contacts")
			.select("id")
			.ilike("name", pattern)
			.or("is_deleted.eq.false,is_deleted.is.null"),
		supabase
			.from("enterprises")
			.select("id")
			.ilike("name", pattern)
			.or("is_deleted.eq.false,is_deleted.is.null"),
		supabase
			.from("organizations")
			.select("id")
			.ilike("name", pattern)
			.or("is_deleted.eq.false,is_deleted.is.null"),
	]);

	if (contactsError) throw contactsError;
	if (enterpriseError) throw enterpriseError;
	if (organizationError) throw organizationError;

	const matchedContactIds = new Set<string>(
		(contactsByName ?? []).map((row) => row.id as string),
	);
	const matchedEnterpriseIds = (enterpriseMatches ?? []).map(
		(row) => row.id as string,
	);
	const matchedOrganizationIds = (organizationMatches ?? []).map(
		(row) => row.id as string,
	);

	const [contactIdsByEnterprise, contactIdsByOrganization] = await Promise.all([
		getContactIdsByForeignKey(supabase, "enterprise_id", matchedEnterpriseIds),
		getContactIdsByForeignKey(
			supabase,
			"organization_id",
			matchedOrganizationIds,
		),
	]);

	for (const contactId of contactIdsByEnterprise)
		matchedContactIds.add(contactId);
	for (const contactId of contactIdsByOrganization) {
		matchedContactIds.add(contactId);
	}

	return [...matchedContactIds];
}

async function getContactIdsByStatus(
	supabase: SupabaseClient,
	status: InteractionStatus,
): Promise<string[] | null> {
	const { data, error } = await supabase
		.from("interactions")
		.select("contact_id")
		.eq("status", status)
		.not("contact_id", "is", null);

	if (error) throw error;
	if (!data?.length) return [];

	return [...new Set((data ?? []).map((row) => row.contact_id as string))];
}

function intersectIdSets(sets: Array<string[] | null>): string[] | null {
	const active = sets.filter((set): set is string[] => set !== null);
	if (active.length === 0) return null;

	let result = active[0];
	for (let i = 1; i < active.length; i += 1) {
		const next = new Set(active[i]);
		result = result.filter((id) => next.has(id));
	}

	return result;
}

export async function getContacts(
	filters: ContactFilters = {},
): Promise<Contact[]> {
	const supabase = await createClient();
	const { familyIds, cicloId, search, status } = filters;

	const [
		contactIdsByFamily,
		contactIdsByCiclo,
		contactIdsBySearch,
		contactIdsByStatus,
	] = await Promise.all([
		familyIds?.length ? getContactIdsByFamilies(supabase, familyIds) : null,
		cicloId ? getContactIdsByCiclo(supabase, cicloId) : null,
		search ? getContactIdsBySearch(supabase, search) : null,
		status ? getContactIdsByStatus(supabase, status) : null,
	]);

	const filteredContactIds = intersectIdSets([
		contactIdsByFamily,
		contactIdsByCiclo,
		contactIdsBySearch,
		contactIdsByStatus,
	]);

	// Either pre-resolution returned an empty match, so no results are possible.
	if (filteredContactIds?.length === 0) return [];

	let query = supabase
		.from("contacts")
		.select(
			"id, name, position, phone, second_phone, email, organization:organizations(id, name), enterprise:enterprises(id, name)",
		)
		.or("is_deleted.eq.false,is_deleted.is.null")
		.order("name");

	if (filteredContactIds) query = query.in("id", filteredContactIds);

	const { data, error } = await query;
	if (error) throw error;
	return (data ?? []).map(mapContact);
}

export async function getContactFamilies(
	contactIds: string[],
): Promise<Map<string, ProfessionalFamily[]>> {
	if (contactIds.length === 0) return new Map();

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select(
			"contact_id,interaction_targets(professional_family:professional_family_id(id,code,name))",
		)
		.in("contact_id", contactIds);

	if (error) throw error;

	const map = new Map<string, ProfessionalFamily[]>();
	for (const row of data ?? []) {
		const contactId = row.contact_id as string;
		for (const target of (row.interaction_targets as
			| Array<{ professional_family: unknown }>
			| null
			| undefined) ?? []) {
			const family = asSingle(
				target.professional_family as
					| { id: string; code: string; name: string }
					| { id: string; code: string; name: string }[]
					| null,
			);
			if (!family) continue;
			const existing = map.get(contactId) ?? [];
			if (!existing.some((f) => f.id === family.id)) existing.push(family);
			map.set(contactId, existing);
		}
	}
	return map;
}

function asSingle<T>(value: T | T[] | null): T | null {
	if (!value) return null;
	return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getContactDetail(id: string): Promise<Contact | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("contacts")
		.select(
			"id,name,position,phone,second_phone,email,created_at,created_by,updated_at,updated_by,organization:organizations(id,name),enterprise:enterprises(id,name)",
		)
		.eq("id", id)
		.or("is_deleted.eq.false,is_deleted.is.null")
		.maybeSingle();

	if (error) throw new Error(error.message);
	if (!data) return null;

	return mapContact(data as Parameters<typeof mapContact>[0]);
}

export async function getContactFamilyLinks(
	contactId: string,
): Promise<ContactFamilyLink[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select(
			"interaction_targets(professional_family:professional_family_id(id,name,code))",
		)
		.eq("contact_id", contactId);

	if (error) throw new Error(error.message);

	const familyMap = new Map<string, ContactFamilyLink>();
	for (const row of data ?? []) {
		for (const target of (row.interaction_targets as
			| Array<{ professional_family: unknown }>
			| null
			| undefined) ?? []) {
			const family = asSingle(
				target.professional_family as
					| { id: string; name: string; code: string }
					| { id: string; name: string; code: string }[]
					| null,
			);
			if (family && !familyMap.has(family.id)) {
				familyMap.set(family.id, family);
			}
		}
	}
	return [...familyMap.values()];
}

export async function getAllActiveCiclos(): Promise<CicloFormativo[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("ciclo_formativo")
		.select(
			"id,name,professional_family_id,professional_family:professional_family_id(code,name)",
		)
		.eq("is_active", true)
		.order("name");

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => {
		const pf = asSingle(
			row.professional_family as
				| { code: string; name: string }
				| { code: string; name: string }[]
				| null,
		);
		return {
			id: row.id as string,
			name: row.name as string,
			professional_family_id: row.professional_family_id as string,
			professional_family_code: pf?.code ?? null,
			professional_family_name: pf?.name ?? null,
		};
	});
}

export async function getCiclosByFamilies(
	familyIds: string[],
): Promise<CicloFormativo[]> {
	if (familyIds.length === 0) return [];

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("ciclo_formativo")
		.select(
			"id,name,professional_family_id,professional_family:professional_family_id(code,name)",
		)
		.in("professional_family_id", familyIds)
		.eq("is_active", true)
		.order("name");

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => {
		const pf = asSingle(
			row.professional_family as
				| { code: string; name: string }
				| { code: string; name: string }[]
				| null,
		);
		return {
			id: row.id as string,
			name: row.name as string,
			professional_family_id: row.professional_family_id as string,
			professional_family_code: pf?.code ?? null,
			professional_family_name: pf?.name ?? null,
		};
	});
}

// Returns the most recent interaction state per (contact, ciclo).
// Used in the contacts list to show "Ciclo / Estado" per contact.
export async function getContactCicloInteractions(
	contactIds: string[],
): Promise<Map<string, ContactCicloEntry[]>> {
	if (contactIds.length === 0) return new Map();

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select(
			"contact_id,status,interaction_targets(ciclo_formativo:ciclo_formativo_id(id,name))",
		)
		.in("contact_id", contactIds)
		.order("occurred_at", { ascending: false });

	if (error) throw new Error(error.message);

	const map = new Map<string, ContactCicloEntry[]>();
	const seen = new Map<string, Set<string>>();

	for (const row of data ?? []) {
		const contactId = row.contact_id as string;

		for (const target of (row.interaction_targets as
			| Array<{ ciclo_formativo: unknown }>
			| null
			| undefined) ?? []) {
			const ciclo = asSingle(
				target.ciclo_formativo as
					| { id: string; name: string }
					| { id: string; name: string }[]
					| null,
			);
			if (!ciclo) continue;

			if (!seen.has(contactId)) seen.set(contactId, new Set());
			const contactSeen = seen.get(contactId) ?? new Set<string>();
			seen.set(contactId, contactSeen);
			if (contactSeen.has(ciclo.id)) continue;

			contactSeen.add(ciclo.id);
			const entries = map.get(contactId) ?? [];
			entries.push({
				cicloId: ciclo.id,
				cicloName: ciclo.name,
				status: row.status as InteractionStatus,
			});
			map.set(contactId, entries);
		}
	}

	return map;
}

export async function getContactInteractions(
	contactId: string,
): Promise<Interaction[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select(
			"id,type,notes,occurred_at,status,requested_students,ciclo_formativo_id,created_at,organization:organizations(id,name),enterprise:enterprises(id,name),interaction_targets(autonomous_community_id,province_id,fp_center_id,professional_family_id,ciclo_formativo_id,autonomous_community:autonomous_community_id(id,name),province:province_id(id,name,autonomous_community_id),fp_center:fp_center_id(id,code,name,province_id),professional_family:professional_family_id(id,code,name),ciclo_formativo:ciclo_formativo_id(id,name,professional_family_id))",
		)
		.eq("contact_id", contactId)
		.order("occurred_at", { ascending: false });

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => {
		const targets =
			(row.interaction_targets as
				| Array<{
						autonomous_community_id: string | null;
						province_id: string | null;
						fp_center_id: string | null;
						professional_family_id: string | null;
						ciclo_formativo_id: string | null;
						autonomous_community: unknown;
						province: unknown;
						fp_center: unknown;
						professional_family: unknown;
						ciclo_formativo: unknown;
				  }>
				| null
				| undefined) ?? [];

		const normalizedTargets = targets.map((target) => {
			const autonomousCommunity = asSingle(
				target.autonomous_community as
					| { id: string; name: string }
					| { id: string; name: string }[]
					| null,
			);
			const province = asSingle(
				target.province as
					| { id: string; name: string; autonomous_community_id: string }
					| { id: string; name: string; autonomous_community_id: string }[]
					| null,
			);
			const fpCenter = asSingle(
				target.fp_center as
					| { id: string; code: string; name: string; province_id: string }
					| { id: string; code: string; name: string; province_id: string }[]
					| null,
			);
			const professionalFamily = asSingle(
				target.professional_family as
					| { id: string; code: string; name: string }
					| { id: string; code: string; name: string }[]
					| null,
			);
			const ciclo = asSingle(
				target.ciclo_formativo as
					| {
							id: string;
							name: string;
							professional_family_id: string;
					  }
					| {
							id: string;
							name: string;
							professional_family_id: string;
					  }[]
					| null,
			);

			return {
				autonomous_community_id: target.autonomous_community_id,
				autonomous_community: autonomousCommunity,
				province_id: target.province_id,
				province,
				fp_center_id: target.fp_center_id,
				fp_center: fpCenter,
				professional_family_id: target.professional_family_id,
				professional_family: professionalFamily,
				ciclo_formativo_id: target.ciclo_formativo_id,
				ciclo_formativo: ciclo,
			};
		});

		const firstCicloWithData =
			normalizedTargets.find((target) => target.ciclo_formativo)
				?.ciclo_formativo ?? null;
		const organization = asSingle(
			row.organization as
				| { id: string; name: string | null }
				| { id: string; name: string | null }[]
				| null,
		);
		const enterprise = asSingle(
			row.enterprise as
				| { id: string; name: string | null }
				| { id: string; name: string | null }[]
				| null,
		);
		return {
			...row,
			targets: normalizedTargets,
			organization,
			enterprise,
			ciclo_formativo_id:
				firstCicloWithData?.id ??
				(row.ciclo_formativo_id as string | null) ??
				null,
			ciclo_formativo: firstCicloWithData
				? { id: firstCicloWithData.id, name: firstCicloWithData.name }
				: null,
		} as Interaction;
	});
}

export type DashboardStats = {
	totalContacts: number;
	totalEnterprises: number;
	totalOrganizations: number;
	agreementReachedCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
	const supabase = await createClient();

	const [
		{ count: totalContacts, error: contactsError },
		{ count: totalEnterprises, error: enterprisesError },
		{ count: totalOrganizations, error: organizationsError },
		{ count: agreementReachedCount, error: agreementsError },
	] = await Promise.all([
		supabase
			.from("contacts")
			.select("*", { count: "exact", head: true })
			.or("is_deleted.eq.false,is_deleted.is.null"),
		supabase
			.from("enterprises")
			.select("*", { count: "exact", head: true })
			.or("is_deleted.eq.false,is_deleted.is.null"),
		supabase
			.from("organizations")
			.select("*", { count: "exact", head: true })
			.or("is_deleted.eq.false,is_deleted.is.null"),
		supabase
			.from("interactions")
			.select("*", { count: "exact", head: true })
			.eq("status", "agreement_reached"),
	]);

	if (contactsError) throw new Error(contactsError.message);
	if (enterprisesError) throw new Error(enterprisesError.message);
	if (organizationsError) throw new Error(organizationsError.message);
	if (agreementsError) throw new Error(agreementsError.message);

	return {
		totalContacts: totalContacts ?? 0,
		totalEnterprises: totalEnterprises ?? 0,
		totalOrganizations: totalOrganizations ?? 0,
		agreementReachedCount: agreementReachedCount ?? 0,
	};
}

export type RecentInteractionItem = {
	id: string;
	contact_id: string | null;
	contact_name: string | null;
	enterprise_name: string | null;
	status: InteractionStatus;
	type: string;
	occurred_at: string;
};

export async function getRecentInteractions(
	limit = 10,
): Promise<RecentInteractionItem[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select(
			"id,contact_id,type,status,occurred_at,contact:contacts(name),enterprise:enterprises(name)",
		)
		.order("occurred_at", { ascending: false })
		.limit(limit);

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => {
		const contact = asSingle(
			row.contact as { name: string | null } | { name: string | null }[] | null,
		);
		const enterprise = asSingle(
			row.enterprise as
				| { name: string | null }
				| { name: string | null }[]
				| null,
		);
		return {
			id: row.id as string,
			contact_id: (row.contact_id as string | null) ?? null,
			contact_name: contact?.name ?? null,
			enterprise_name: enterprise?.name ?? null,
			status: row.status as InteractionStatus,
			type: row.type as string,
			occurred_at: row.occurred_at as string,
		};
	});
}

export async function getContactInteractionSummaries(
	contactIds: string[],
): Promise<Map<string, ContactInteractionSummary>> {
	if (contactIds.length === 0) return new Map();

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select("contact_id,occurred_at,status,requested_students,created_at")
		.in("contact_id", contactIds)
		.order("occurred_at", { ascending: false })
		.order("created_at", { ascending: false });

	if (error) throw new Error(error.message);

	const map = new Map<string, ContactInteractionSummary>();

	for (const row of data ?? []) {
		const contactId = row.contact_id as string | null;
		if (!contactId) continue;

		const current = map.get(contactId);
		const requestedStudents = REQUESTED_STUDENTS_REQUIRED_STATUS_SET.has(
			row.status as InteractionStatus,
		)
			? ((row.requested_students as number | null) ?? 0)
			: 0;

		if (!current) {
			map.set(contactId, {
				lastInteractionAt: row.occurred_at as string,
				lastInteractionStatus: row.status as InteractionStatus,
				requestedStudentsTotal: requestedStudents,
			});
			continue;
		}

		current.requestedStudentsTotal += requestedStudents;
	}

	return map;
}
