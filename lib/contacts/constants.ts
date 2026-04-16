import type { InteractionStatus, InteractionType } from "./types";

export const INTERACTION_TYPES: InteractionType[] = [
	"call",
	"visit",
	"email",
	"meeting",
	"other",
];

export const INTERACTION_TYPE_SET = new Set<InteractionType>(INTERACTION_TYPES);

export const INTERACTION_STATUSES: InteractionStatus[] = [
	"unknown",
	"contacted",
	"interested",
	"not_interested",
	"agreement_reached",
	"hired",
	"do_not_contact",
];

export const INTERACTION_STATUS_SET = new Set<InteractionStatus>(
	INTERACTION_STATUSES,
);

export const OPEN_INTERACTION_STATUSES: InteractionStatus[] = [
	"unknown",
	"contacted",
	"interested",
];

export const OPEN_INTERACTION_STATUS_SET = new Set<InteractionStatus>(
	OPEN_INTERACTION_STATUSES,
);

export const REQUESTED_STUDENTS_REQUIRED_STATUSES: InteractionStatus[] = [
	"agreement_reached",
	"hired",
];

export const REQUESTED_STUDENTS_REQUIRED_STATUS_SET =
	new Set<InteractionStatus>(REQUESTED_STUDENTS_REQUIRED_STATUSES);
