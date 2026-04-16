"use server";

import { revalidatePath } from "next/cache";
import { asNullable } from "@/lib/contacts/form-utils";
import { requireWritePermission } from "@/lib/fake-auth";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
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
		created_by: user.userId,
		updated_by: user.userId,
	};

	const { error } = await supabase.from("organizations").insert(payload);
	if (error) throw new Error(error.message);

	revalidatePath("/organizations");
}
