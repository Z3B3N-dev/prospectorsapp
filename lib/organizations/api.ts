import type { OrganizationOption } from "../contacts/ui-types";
import { createClient } from "../supabase/server";

export type OrganizationListItem = {
	id: string;
	name: string | null;
	city: string | null;
	province: string | null;
	phone: string | null;
	email: string | null;
};

export type OrganizationDetail = {
	id: string;
	name: string | null;
	address: string | null;
	city: string | null;
	province: string | null;
	phone: string | null;
	email: string | null;
	is_deleted: boolean;
	created_at: string | null;
	updated_at: string | null;
};

export async function getOrganizations(): Promise<OrganizationOption[]> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("organizations")
		.select("id,name")
		.or("is_deleted.eq.false,is_deleted.is.null")
		.order("name");

	if (error) throw new Error(error.message);
	return (data ?? []) as OrganizationOption[];
}

export async function getOrganizationList(
	filters: { q?: string } = {},
): Promise<OrganizationListItem[]> {
	const supabase = await createClient();
	let query = supabase
		.from("organizations")
		.select("id, name, city, province, phone, email")
		.or("is_deleted.eq.false,is_deleted.is.null")
		.order("name");

	if (filters.q) {
		query = query.ilike("name", `%${filters.q}%`);
	}

	const { data, error } = await query;

	if (error) throw new Error(error.message);

	return (data ?? []).map((row) => ({
		id: row.id as string,
		name: (row.name as string | null) ?? null,
		city: (row.city as string | null) ?? null,
		province: (row.province as string | null) ?? null,
		phone: (row.phone as string | null) ?? null,
		email: (row.email as string | null) ?? null,
	}));
}

export async function getOrganizationById(
	id: string,
): Promise<OrganizationDetail | null> {
	const supabase = await createClient();
	const { data, error } = await supabase
		.from("organizations")
		.select("id, name, address, city, province, phone, email, is_deleted, created_at, updated_at")
		.eq("id", id)
		.or("is_deleted.eq.false,is_deleted.is.null")
		.limit(1)
		.maybeSingle();

	if (error) throw new Error(error.message);
	if (!data) return null;

	return {
		id: data.id as string,
		name: (data.name as string | null) ?? null,
		address: (data.address as string | null) ?? null,
		city: (data.city as string | null) ?? null,
		province: (data.province as string | null) ?? null,
		phone: (data.phone as string | null) ?? null,
		email: (data.email as string | null) ?? null,
		is_deleted: (data.is_deleted as boolean) ?? false,
		created_at: (data.created_at as string | null) ?? null,
		updated_at: (data.updated_at as string | null) ?? null,
	};
}
