import { INTERACTION_STATUSES, INTERACTION_TYPES } from "./constants";
import type { InteractionStatus, InteractionType } from "./types";

export const INTERACTION_TYPE_LABELS_ES: Record<InteractionType, string> = {
	call: "Llamada",
	visit: "Visita",
	email: "Email",
	meeting: "Reunión",
	other: "Otro",
};

export const INTERACTION_STATUS_LABELS_ES: Record<InteractionStatus, string> = {
	unknown: "Desconocido",
	contacted: "Contactado",
	interested: "Interesado",
	not_interested: "No interesado",
	agreement_reached: "Acuerdo alcanzado",
	hired: "Contratado",
	do_not_contact: "No contactar",
};

export const INTERACTION_TYPE_OPTIONS_ES: Array<{
	value: InteractionType;
	label: string;
}> = INTERACTION_TYPES.map((value) => ({
	value,
	label: INTERACTION_TYPE_LABELS_ES[value],
}));

export const INTERACTION_STATUS_OPTIONS_ES: Array<{
	value: InteractionStatus;
	label: string;
}> = INTERACTION_STATUSES.map((value) => ({
	value,
	label: INTERACTION_STATUS_LABELS_ES[value],
}));
