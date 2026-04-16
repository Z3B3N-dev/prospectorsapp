import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

function readEnv(filePath) {
	const map = {};
	const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) continue;
		const idx = trimmed.indexOf("=");
		if (idx <= 0) continue;
		map[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
	}
	return map;
}

function normalize(input) {
	return input
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, " ")
		.trim();
}

function isCicloActive(name) {
	const lower = name.toLowerCase();
	if (lower.startsWith("curso de especializaci")) return false;
	if (lower.startsWith("coordinacion del personal en reuniones profesionales"))
		return false;
	return true;
}

async function main() {
	const env = readEnv(".env.local");
	const supabase = createClient(
		env.NEXT_PUBLIC_SUPABASE_URL,
		env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	);

	const raw = JSON.parse(
		fs.readFileSync("supabase/snippets/todofp-ciclos.json", "utf8"),
	);
	const sourceRows = raw.data ?? raw;

	const { data: families, error: familyError } = await supabase
		.from("professional_family")
		.select("id, name");

	if (familyError) throw familyError;

	const familyByName = new Map(families.map((f) => [normalize(f.name), f.id]));

	const payload = [];
	const unmatchedFamilies = new Map();

	for (const row of sourceRows) {
		const familyId = familyByName.get(normalize(row.family_name));
		if (!familyId) {
			unmatchedFamilies.set(
				row.family_name,
				(unmatchedFamilies.get(row.family_name) ?? 0) + 1,
			);
			continue;
		}

		payload.push({
			professional_family_id: familyId,
			name: row.ciclo_name,
			source_url: row.source_url,
			is_active: isCicloActive(row.ciclo_name),
		});
	}

	const { error: upsertError } = await supabase
		.from("ciclo_formativo")
		.upsert(payload, {
			onConflict: "professional_family_id,name",
			ignoreDuplicates: false,
		});

	if (upsertError) throw upsertError;

	console.log(
		JSON.stringify(
			{
				sourceCount: sourceRows.length,
				insertedOrUpdated: payload.length,
				unmatchedFamilies: [...unmatchedFamilies.entries()],
			},
			null,
			2,
		),
	);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
