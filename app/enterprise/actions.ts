"use server";

import { revalidatePath } from "next/cache";
import { requireWritePermission } from "@/lib/fake-auth";
import { createClient } from "@/lib/supabase/server";
import { asNullable } from "@/lib/contacts/form-utils";
import { ENTERPRISE_TYPES } from "@/lib/enterprises/constants";
import type { EnterpriseType } from "@/lib/enterprises/constants";

function readEnterpriseType(formData: FormData): EnterpriseType {
	const raw = String(formData.get("type") ?? "").trim();
	if ((ENTERPRISE_TYPES as readonly string[]).includes(raw)) {
		return raw as EnterpriseType;
	}
	return "company";
}

export async function createEnterprise(formData: FormData) {
	const user = await requireWritePermission();
	const supabase = await createClient();

	const name = String(formData.get("name") ?? "").trim();
	if (!name) {
		throw new Error("El nombre de la empresa es obligatorio.");
	}

	const organizationId = asNullable(formData.get("organization_id"));
	if (organizationId) {
		const { data: org, error: orgError } = await supabase
			.from("organizations")
			.select("id,is_deleted")
			.eq("id", organizationId)
			.limit(1)
			.maybeSingle();

		if (orgError) throw new Error(orgError.message);
		if (!org || org.is_deleted === true) {
			throw new Error(
				"El grupo empresarial seleccionado no existe o está eliminado.",
			);
		}
	}

	const payload = {
		name,
		normalized_name: name.toLowerCase().trim(),
		type: readEnterpriseType(formData),
		address: asNullable(formData.get("address")),
		city: asNullable(formData.get("city")),
		province: asNullable(formData.get("province")),
		tax_id: asNullable(formData.get("tax_id")),
		organization_id: organizationId,
		created_by: user.userId,
		updated_by: user.userId,
	};

	const { error } = await supabase.from("enterprises").insert(payload);
	if (error) throw new Error(error.message);

	revalidatePath("/enterprise");
}
