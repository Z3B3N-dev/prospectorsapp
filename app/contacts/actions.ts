"use server";

import { revalidatePath } from "next/cache";
import { asNullable } from "@/lib/contacts/form-utils";
import { requireWritePermission } from "@/lib/fake-auth";
import { createClient } from "@/lib/supabase/server";

export async function createContact(formData: FormData) {
	const user = await requireWritePermission();
	const supabase = await createClient();

	const name = String(formData.get("name") ?? "").trim();
	if (!name) {
		throw new Error("El nombre del contacto es obligatorio.");
	}

	const organizationId = asNullable(formData.get("organization_id"));
	const enterpriseId = asNullable(formData.get("enterprise_id"));

	let resolvedOrganizationId = organizationId;

	if (enterpriseId) {
		const { data: enterprise, error: enterpriseError } = await supabase
			.from("enterprises")
			.select("id,organization_id,is_deleted")
			.eq("id", enterpriseId)
			.limit(1)
			.maybeSingle();

		if (enterpriseError) throw new Error(enterpriseError.message);
		if (!enterprise || enterprise.is_deleted === true) {
			throw new Error("La empresa seleccionada no existe o está eliminada.");
		}

		const parentOrganizationId =
			(enterprise.organization_id as string | null) ?? null;
		if (organizationId !== parentOrganizationId) {
			if (parentOrganizationId) {
				throw new Error(
					"El Grupo empresarial debe coincidir con el grupo al que pertenece la Empresa seleccionada.",
				);
			}

			throw new Error(
				"La Empresa seleccionada no pertenece a ningún Grupo empresarial y no permite asignar uno manualmente.",
			);
		}

		resolvedOrganizationId = parentOrganizationId;
	} else if (organizationId) {
		const { data: organization, error: organizationError } = await supabase
			.from("organizations")
			.select("id,is_deleted")
			.eq("id", organizationId)
			.limit(1)
			.maybeSingle();

		if (organizationError) throw new Error(organizationError.message);
		if (!organization || organization.is_deleted === true) {
			throw new Error(
				"El Grupo empresarial seleccionado no existe o está eliminado.",
			);
		}
	}

	const payload = {
		name,
		position: asNullable(formData.get("position")),
		phone: asNullable(formData.get("phone")),
		second_phone: asNullable(formData.get("second_phone")),
		email: asNullable(formData.get("email")),
		organization_id: resolvedOrganizationId,
		enterprise_id: enterpriseId,
		created_by: user.userId,
		updated_by: user.userId,
	};

	const { error } = await supabase.from("contacts").insert(payload);
	if (error) throw new Error(error.message);

	revalidatePath("/contacts");
}
