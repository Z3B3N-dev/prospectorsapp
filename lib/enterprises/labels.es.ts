import { ENTERPRISE_TYPES } from "./constants";
import type { EnterpriseType } from "./constants";

export const ENTERPRISE_TYPE_LABELS_ES: Record<EnterpriseType, string> = {
	company: "Empresa privada",
	public: "Entidad pública",
	other: "Otro",
};

export const ENTERPRISE_TYPE_OPTIONS_ES = ENTERPRISE_TYPES.map((type) => ({
	value: type,
	label: ENTERPRISE_TYPE_LABELS_ES[type],
}));
