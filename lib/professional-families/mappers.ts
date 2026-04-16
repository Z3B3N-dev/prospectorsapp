import type { ProfessionalFamily } from "./types";

export function mapProfessionalFamily(raw: {
	id: string;
	code: string;
	name: string;
}): ProfessionalFamily {
	return {
		id: raw.id,
		code: raw.code,
		name: raw.name,
	};
}
