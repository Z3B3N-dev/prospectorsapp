import type { InteractionType } from "./types";

export type InteractionTypeOption = {
	value: InteractionType;
	label: string;
};

export type CicloOption = {
	id: string;
	name: string;
	professionalFamilyId: string;
	professionalFamilyCode: string | null;
	familyName: string | null;
};

export type OrganizationOption = {
	id: string;
	name: string | null;
};

export type AutonomousCommunityOption = {
	id: string;
	code: string;
	name: string;
};

export type ProvinceOption = {
	id: string;
	name: string;
	autonomousCommunityId: string;
};

export type FpCenterOption = {
	id: string;
	code: string;
	name: string;
	provinceId: string;
	autonomousCommunityId: string;
	professionalFamilyIds: string[];
};

export type EnterpriseOption = {
	id: string;
	name: string | null;
	organizationId: string | null;
};
