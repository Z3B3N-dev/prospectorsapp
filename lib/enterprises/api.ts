import { createClient } from "../supabase/server";
import type { EnterpriseOption } from "../contacts/ui-types";
import type { EnterpriseType } from "./constants";

export type EnterpriseListItem = {
	id: string;
	name: string | null;
	type: EnterpriseType | null;
	city: string | null;
	province: string | null;
	organization_id: string | null;
	organization_name: string | null;
};

export type EnterpriseDetail = {
	id: string;
	name: string | null;
	type: EnterpriseType | null;
	address: string | null;
	city: string | null;
	province: string | null;
	tax_id: string | null;
	organization_id: string | null;
	organization_name: string | null;
	is_deleted: boolean;
	created_at: string | null;
	updated_at: string | null;
};

export type EnterpriseContactOption = EnterpriseOption;

export async function getEnterpriseList(
	filters: { q?: string } = {},
): Promise<EnterpriseListItem[]> {
	const supabase = await createClient();
	let query = supabase
		.from("enterprises")
		.select("id, name, type, city, province, organization_id, organizations(name)")
		.or("is_deleted.eq.false,is_deleted.is.null")
		.order("name");

	if (filters.q) {
		query = query.ilike("name", `%${filters.q}%`);
	}

	const { data, error } = await query;

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => {
		const org = Array.isArray(row.organizations)
			? row.organizations[0]
			: row.organizations;
		return {
			id: row.id as string,
			name: (row.name as string | null) ?? null,
			type: (row.type as EnterpriseType | null) ?? null,
			city: (row.city as string | null) ?? null,
			province: (row.province as string | null) ?? null,
			organization_id: (row.organization_id as string | null) ?? null,
			organization_name: (org as { name?: string | null } | null)?.name ?? null,
		};
	});
}

export async function getEnterpriseById(
	id: string,
): Promise<EnterpriseDetail | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("enterprises")
		.select(
			"id, name, type, address, city, province, tax_id, organization_id, is_deleted, created_at, updated_at, organizations(name)",
		)
		.eq("id", id)
		.or("is_deleted.eq.false,is_deleted.is.null")
		.limit(1)
		.maybeSingle();

	if (error) throw new Error(error.message);
	if (!data) return null;

	const org = Array.isArray(data.organizations)
		? data.organizations[0]
		: data.organizations;

	return {
		id: data.id as string,
		name: (data.name as string | null) ?? null,
		type: (data.type as EnterpriseType | null) ?? null,
		address: (data.address as string | null) ?? null,
		city: (data.city as string | null) ?? null,
		province: (data.province as string | null) ?? null,
		tax_id: (data.tax_id as string | null) ?? null,
		organization_id: (data.organization_id as string | null) ?? null,
		organization_name: (org as { name?: string | null } | null)?.name ?? null,
		is_deleted: (data.is_deleted as boolean) ?? false,
		created_at: (data.created_at as string | null) ?? null,
		updated_at: (data.updated_at as string | null) ?? null,
	};
}

// Legacy: keep for backward compatibility
export async function getEnterprises(): Promise<{
	enterprises: { id: string; name?: string | null; city?: string | null }[];
	sourceTable: string | null;
}> {
	const enterprises = await getEnterpriseList();
	return { enterprises, sourceTable: "enterprises" };
}

export async function getEnterpriseContactOptions(): Promise<
	EnterpriseContactOption[]
> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("enterprises")
		.select("id,name,organization_id")
		.or("is_deleted.eq.false,is_deleted.is.null")
		.order("name");

	if (error) throw new Error(error.message);

	return (data ?? []).map((enterprise) => ({
		id: enterprise.id as string,
		name: (enterprise.name as string | null) ?? null,
		organizationId: (enterprise.organization_id as string | null) ?? null,
	}));
}
