import {
	INTERACTION_STATUS_SET,
	REQUESTED_STUDENTS_REQUIRED_STATUS_SET,
} from "./constants";
import type { InteractionStatus } from "./types";

export type InteractionTargetInput = {
	professionalFamilyId: string | null;
	cicloFormativoId: string | null;
	autonomousCommunityId: string | null;
	provinceId: string | null;
	fpCenterId: string | null;
};

export function readInteractionStatus(formData: FormData): InteractionStatus {
	const value = String(formData.get("status") ?? "").trim();
	if (INTERACTION_STATUS_SET.has(value as InteractionStatus)) {
		return value as InteractionStatus;
	}

	return "unknown";
}

export function asIsoDateTime(input: string | null): string {
	if (!input) return new Date().toISOString();
	return new Date(input).toISOString();
}

export function asNullable(value: FormDataEntryValue | null): string | null {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function readRequestedStudents(
	formData: FormData,
	status: InteractionStatus,
): number | null {
	const value = asNullable(formData.get("requested_students"));

	if (!REQUESTED_STUDENTS_REQUIRED_STATUS_SET.has(status)) {
		return null;
	}

	if (!value) {
		throw new Error(
			"Debes indicar los alumnos solicitados cuando el estado es acuerdo alcanzado o contratado.",
		);
	}

	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1) {
		throw new Error(
			"Alumnos solicitados debe ser un numero entero mayor que 0.",
		);
	}

	return parsed;
}

export function readInteractionTargets(
	formData: FormData,
): InteractionTargetInput[] {
	const familyValues = formData.getAll("target_family_id[]");
	const cicloValues = formData.getAll("target_ciclo_id[]");
	const communityValues = formData.getAll("target_autonomous_community_id[]");
	const provinceValues = formData.getAll("target_province_id[]");
	const centerValues = formData.getAll("target_fp_center_id[]");

	if (
		familyValues.length !== cicloValues.length ||
		familyValues.length !== communityValues.length ||
		familyValues.length !== provinceValues.length ||
		familyValues.length !== centerValues.length
	) {
		throw new Error("Los objetivos de interacción tienen un formato inválido.");
	}

	const out: InteractionTargetInput[] = [];
	const seen = new Set<string>();

	for (let i = 0; i < familyValues.length; i += 1) {
		const professionalFamilyId = asNullable(familyValues[i] ?? null);
		const cicloFormativoId = asNullable(cicloValues[i] ?? null);
		const autonomousCommunityId = asNullable(communityValues[i] ?? null);
		const provinceId = asNullable(provinceValues[i] ?? null);
		const fpCenterId = asNullable(centerValues[i] ?? null);
		const key = `${professionalFamilyId ?? "null"}::${cicloFormativoId ?? "null"}::${autonomousCommunityId ?? "null"}::${provinceId ?? "null"}::${fpCenterId ?? "null"}`;
		if (seen.has(key)) continue;
		seen.add(key);

		out.push({
			professionalFamilyId,
			cicloFormativoId,
			autonomousCommunityId,
			provinceId,
			fpCenterId,
		});
	}

	return out;
}
