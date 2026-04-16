import { createClient } from "../supabase/server";
import type {
	AutonomousCommunityOption,
	FpCenterOption,
	ProvinceOption,
} from "../contacts/ui-types";

type FpCenterFormOptions = {
	autonomousCommunities: AutonomousCommunityOption[];
	provinces: ProvinceOption[];
	centers: FpCenterOption[];
};

export async function getFpCenterFormOptions(): Promise<FpCenterFormOptions> {
	const supabase = await createClient();

	const [
		{ data: communities, error: communitiesError },
		{ data: provinces, error: provincesError },
		{ data: centers, error: centersError },
	] = await Promise.all([
		supabase
			.from("autonomous_communities")
			.select("id,code,name")
			.order("name"),
		supabase
			.from("provinces")
			.select("id,name,autonomous_community_id")
			.order("name"),
		supabase
			.from("fp_centers")
			.select(
				"id,code,name,province_id,province:provinces(autonomous_community_id),families:fp_center_professional_families(professional_family_id)",
			)
			.eq("is_active", true)
			.order("name"),
	]);

	if (communitiesError) throw new Error(communitiesError.message);
	if (provincesError) throw new Error(provincesError.message);
	if (centersError) throw new Error(centersError.message);

	return {
		autonomousCommunities: (communities ?? []).map((row) => ({
			id: row.id as string,
			code: row.code as string,
			name: row.name as string,
		})),
		provinces: (provinces ?? []).map((row) => ({
			id: row.id as string,
			name: row.name as string,
			autonomousCommunityId: row.autonomous_community_id as string,
		})),
		centers: (centers ?? []).map((row) => {
			const province = Array.isArray(row.province)
				? row.province[0]
				: row.province;
			const families = Array.isArray(row.families) ? row.families : [];
			return {
				id: row.id as string,
				code: row.code as string,
				name: row.name as string,
				provinceId: row.province_id as string,
				autonomousCommunityId:
					(province?.autonomous_community_id as string) ?? "",
				professionalFamilyIds: families
					.map((family) => family.professional_family_id as string)
					.filter(Boolean),
			};
		}),
	};
}
