"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asNullable } from "@/lib/contacts/form-utils";
import {
	canDeleteRecordByCreator,
	requireFakeUser,
	requireWritePermission,
} from "@/lib/fake-auth";
import { createClient } from "@/lib/supabase/server";

export async function updateOrganization(
	organizationId: string,
	formData: FormData,
) {
	const user = await requireWritePermission();
	const supabase = await createClient();

	const name = String(formData.get("name") ?? "").trim();
	if (!name) {
		throw new Error("El nombre del grupo empresarial es obligatorio.");
	}

	const payload = {
		name,
		address: asNullable(formData.get("address")),
		city: asNullable(formData.get("city")),
		province: asNullable(formData.get("province")),
		phone: asNullable(formData.get("phone")),
		email: asNullable(formData.get("email")),
		updated_by: user.userId,
	};

	const { error } = await supabase
		.from("organizations")
		.update(payload)
		.eq("id", organizationId);

	if (error) throw new Error(error.message);

	revalidatePath(`/organizations/${organizationId}`);
	revalidatePath("/organizations");
}

export async function deleteOrganization(organizationId: string) {
	const user = await requireFakeUser();
	const supabase = await createClient();

	const { data: organization, error: organizationError } = await supabase
		.from("organizations")
		.select("id,created_by")
		.eq("id", organizationId)
		.limit(1)
		.maybeSingle();

	if (organizationError) throw new Error(organizationError.message);
	if (!organization) throw new Error("El grupo empresarial no existe.");

	if (
		!canDeleteRecordByCreator(
			user,
			(organization.created_by as string | null) ?? null,
		)
	) {
		throw new Error(
			"No puedes eliminar este grupo empresarial porque no fue creado por ti.",
		);
	}

	const { error } = await supabase
		.from("organizations")
		.update({ is_deleted: true })
		.eq("id", organizationId);

	if (error) throw new Error(error.message);

	revalidatePath("/organizations");
	redirect("/organizations");
}
