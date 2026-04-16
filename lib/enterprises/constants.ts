export const ENTERPRISE_TYPES = ["company", "public", "other"] as const;
export type EnterpriseType = (typeof ENTERPRISE_TYPES)[number];
