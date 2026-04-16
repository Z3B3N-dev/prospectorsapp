import { createClient } from "../supabase/server";
import { mapProfessionalFamily } from "./mappers";
import type { ProfessionalFamily } from "./types";

export async function getProfessionalFamilies(): Promise<ProfessionalFamily[]> {
	const supabase = await createClient();

	const { data, error } = await supabase
		.from("professional_family")
		.select("id, code, name")
		.order("code");

	if (error) throw error;
	return (data ?? []).map(mapProfessionalFamily);
}
