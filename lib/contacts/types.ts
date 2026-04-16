import type { ProfessionalFamily } from "../professional-families/types";

export type InteractionStatus =
	| "unknown"
	| "contacted"
	| "interested"
	| "not_interested"
	| "agreement_reached"
	| "hired"
	| "do_not_contact";

export type Contact = {
	id: string;
	name: string | null;
	position: string | null;
	phone: string | null;
	second_phone: string | null;
	email: string | null;
	created_at: string | null;
	created_by: string | null;
	updated_at: string | null;
	updated_by: string | null;
	organization: { id: string; name: string | null } | null;
	enterprise: { id: string; name: string | null } | null;
};

export type ContactFilters = {
	familyIds?: string[];
	cicloId?: string;
	search?: string;
	status?: InteractionStatus;
};

export type ContactSortField =
	| "name"
	| "organization"
	| "enterprise"
	| "requested_students"
	| "last_interaction";

export type SortDirection = "asc" | "desc";

export type ContactWithFamilies = Contact & {
	families: ProfessionalFamily[];
};

export type ContactFamilyLink = {
	id: string;
	name: string;
	code: string;
};

export type InteractionType = "call" | "visit" | "email" | "meeting" | "other";

export type CicloFormativo = {
	id: string;
	name: string;
	professional_family_id: string;
	professional_family_code: string | null;
	professional_family_name: string | null;
};

export type InteractionTarget = {
	autonomous_community_id: string | null;
	autonomous_community: {
		id: string;
		name: string;
	} | null;
	province_id: string | null;
	province: {
		id: string;
		name: string;
		autonomous_community_id: string;
	} | null;
	fp_center_id: string | null;
	fp_center: {
		id: string;
		code: string;
		name: string;
		province_id: string;
	} | null;
	professional_family_id: string | null;
	professional_family: {
		id: string;
		code: string;
		name: string;
	} | null;
	ciclo_formativo_id: string | null;
	ciclo_formativo: {
		id: string;
		name: string;
		professional_family_id: string;
	} | null;
};

export type Interaction = {
	id: string;
	type: InteractionType;
	notes: string | null;
	occurred_at: string;
	status: InteractionStatus;
	requested_students: number | null;
	targets: InteractionTarget[];
	// Kept for compatibility while migrating the UI to multi-target interactions.
	ciclo_formativo_id: string | null;
	created_at: string;
	organization: { id: string; name: string | null } | null;
	enterprise: { id: string; name: string | null } | null;
	ciclo_formativo: { id: string; name: string } | null;
};

export type ContactCicloEntry = {
	cicloId: string;
	cicloName: string;
	status: InteractionStatus;
};

export type ContactInteractionSummary = {
	lastInteractionAt: string | null;
	lastInteractionStatus: InteractionStatus | null;
	requestedStudentsTotal: number;
};
