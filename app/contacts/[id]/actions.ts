"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
	canDeleteRecordByCreator,
	requireFakeUser,
	requireWritePermission,
	type FakeAuthUser,
} from "@/lib/fake-auth";
import {
	INTERACTION_TYPE_SET,
	OPEN_INTERACTION_STATUSES,
} from "@/lib/contacts/constants";
import {
	asIsoDateTime,
	asNullable,
	readInteractionTargets,
	readRequestedStudents,
	readInteractionStatus,
	type InteractionTargetInput,
} from "@/lib/contacts/form-utils";
import type { InteractionType } from "@/lib/contacts/types";

async function ensureTutorCanAccessContact(
	user: FakeAuthUser,
	contactId: string,
) {
	if (user.role !== "tutor") return;
	if (!user.professionalFamilyId) {
		throw new Error("No tienes una familia profesional asignada.");
	}

	const supabase = await createClient();
	const { data, error } = await supabase
		.from("interactions")
		.select("id,interaction_targets(professional_family_id)")
		.eq("contact_id", contactId)
		.limit(50);

	if (error) throw new Error(error.message);

	const canAccess = (data ?? []).some((interaction) =>
		(
			interaction.interaction_targets as
				| Array<{ professional_family_id: string | null }>
				| null
				| undefined
		)?.some(
			(target) => target.professional_family_id === user.professionalFamilyId,
		),
	);

	if (!canAccess) {
		throw new Error(
			"No puedes operar sobre contactos fuera de tu familia profesional.",
		);
	}
}

async function normalizeInteractionTargets(
	user: FakeAuthUser,
	rawTargets: InteractionTargetInput[],
) {
	const supabase = await createClient();

	const familyIds = [
		...new Set(
			rawTargets
				.map((target) => target.professionalFamilyId)
				.filter((value): value is string => Boolean(value)),
		),
	];

	const cicloIds = [
		...new Set(
			rawTargets
				.map((target) => target.cicloFormativoId)
				.filter((value): value is string => Boolean(value)),
		),
	];

	const autonomousCommunityIds = [
		...new Set(
			rawTargets
				.map((target) => target.autonomousCommunityId)
				.filter((value): value is string => Boolean(value)),
		),
	];

	const provinceIds = [
		...new Set(
			rawTargets
				.map((target) => target.provinceId)
				.filter((value): value is string => Boolean(value)),
		),
	];

	const centerIds = [
		...new Set(
			rawTargets
				.map((target) => target.fpCenterId)
				.filter((value): value is string => Boolean(value)),
		),
	];

	const [
		{ data: families, error: familyError },
		{ data: ciclos, error: cicloError },
		{ data: autonomousCommunities, error: autonomousCommunitiesError },
		{ data: provinces, error: provincesError },
		{ data: centers, error: centersError },
		{ data: centerFamilies, error: centerFamiliesError },
	] = await Promise.all([
		familyIds.length > 0
			? supabase.from("professional_family").select("id").in("id", familyIds)
			: Promise.resolve({ data: [], error: null }),
		cicloIds.length > 0
			? supabase
					.from("ciclo_formativo")
					.select("id,professional_family_id")
					.in("id", cicloIds)
			: Promise.resolve({ data: [], error: null }),
		autonomousCommunityIds.length > 0
			? supabase
					.from("autonomous_communities")
					.select("id")
					.in("id", autonomousCommunityIds)
			: Promise.resolve({ data: [], error: null }),
		provinceIds.length > 0
			? supabase
					.from("provinces")
					.select("id,autonomous_community_id")
					.in("id", provinceIds)
			: Promise.resolve({ data: [], error: null }),
		centerIds.length > 0
			? supabase.from("fp_centers").select("id,province_id").in("id", centerIds)
			: Promise.resolve({ data: [], error: null }),
		centerIds.length > 0
			? supabase
					.from("fp_center_professional_families")
					.select("fp_center_id,professional_family_id")
					.in("fp_center_id", centerIds)
			: Promise.resolve({ data: [], error: null }),
	]);

	if (familyError) throw new Error(familyError.message);
	if (cicloError) throw new Error(cicloError.message);
	if (autonomousCommunitiesError)
		throw new Error(autonomousCommunitiesError.message);
	if (provincesError) throw new Error(provincesError.message);
	if (centersError) throw new Error(centersError.message);
	if (centerFamiliesError) throw new Error(centerFamiliesError.message);

	const familySet = new Set((families ?? []).map((row) => row.id as string));
	for (const familyId of familyIds) {
		if (!familySet.has(familyId)) {
			throw new Error("Alguna familia profesional seleccionada no es válida.");
		}
	}

	const cicloMap = new Map(
		(ciclos ?? []).map((row) => [
			row.id as string,
			{ professionalFamilyId: row.professional_family_id as string },
		]),
	);

	for (const cicloId of cicloIds) {
		if (!cicloMap.has(cicloId)) {
			throw new Error("Algún ciclo formativo seleccionado no es válido.");
		}
	}

	const autonomousCommunitySet = new Set(
		(autonomousCommunities ?? []).map((row) => row.id as string),
	);
	for (const autonomousCommunityId of autonomousCommunityIds) {
		if (!autonomousCommunitySet.has(autonomousCommunityId)) {
			throw new Error("Alguna comunidad autónoma seleccionada no es válida.");
		}
	}

	const provinceMap = new Map(
		(provinces ?? []).map((row) => [
			row.id as string,
			{ autonomousCommunityId: row.autonomous_community_id as string },
		]),
	);
	for (const provinceId of provinceIds) {
		if (!provinceMap.has(provinceId)) {
			throw new Error("Alguna provincia seleccionada no es válida.");
		}
	}

	const centerMap = new Map(
		(centers ?? []).map((row) => [
			row.id as string,
			{ provinceId: row.province_id as string },
		]),
	);
	for (const centerId of centerIds) {
		if (!centerMap.has(centerId)) {
			throw new Error("Algún centro FP seleccionado no es válido.");
		}
	}

	const centerFamilyPairSet = new Set(
		(centerFamilies ?? []).map(
			(row) =>
				`${row.fp_center_id as string}::${row.professional_family_id as string}`,
		),
	);

	const normalized = new Map<
		string,
		{
			autonomousCommunityId: string | null;
			provinceId: string | null;
			fpCenterId: string | null;
			professionalFamilyId: string | null;
			cicloFormativoId: string | null;
		}
	>();

	for (const rawTarget of rawTargets) {
		const ciclo = rawTarget.cicloFormativoId
			? cicloMap.get(rawTarget.cicloFormativoId)
			: null;

		let professionalFamilyId = rawTarget.professionalFamilyId;
		const autonomousCommunityId = rawTarget.autonomousCommunityId;
		const provinceId = rawTarget.provinceId;
		const fpCenterId = rawTarget.fpCenterId;

		if (provinceId && !autonomousCommunityId) {
			throw new Error(
				"No se puede seleccionar provincia sin comunidad autónoma.",
			);
		}

		if (fpCenterId && (!autonomousCommunityId || !provinceId)) {
			throw new Error(
				"No se puede seleccionar centro sin comunidad y provincia.",
			);
		}

		if (fpCenterId && !professionalFamilyId) {
			throw new Error(
				"No se puede seleccionar centro sin definir familia profesional.",
			);
		}

		if (provinceId) {
			const province = provinceMap.get(provinceId);
			if (!province) {
				throw new Error("Alguna provincia seleccionada no es válida.");
			}
			if (autonomousCommunityId !== province.autonomousCommunityId) {
				throw new Error(
					"La provincia debe pertenecer a la comunidad autónoma seleccionada.",
				);
			}
		}

		if (fpCenterId) {
			const center = centerMap.get(fpCenterId);
			if (!center) {
				throw new Error("Algún centro FP seleccionado no es válido.");
			}
			if (center.provinceId !== provinceId) {
				throw new Error(
					"El centro FP debe pertenecer a la provincia seleccionada.",
				);
			}

			if (
				professionalFamilyId &&
				!centerFamilyPairSet.has(`${fpCenterId}::${professionalFamilyId}`)
			) {
				throw new Error(
					"El centro FP seleccionado no imparte la familia profesional elegida.",
				);
			}
		}

		if (ciclo) {
			if (
				professionalFamilyId &&
				professionalFamilyId !== ciclo.professionalFamilyId
			) {
				throw new Error(
					"La familia profesional debe coincidir con la del ciclo seleccionado.",
				);
			}
			professionalFamilyId = professionalFamilyId ?? ciclo.professionalFamilyId;
		}

		if (user.role === "tutor") {
			if (!user.professionalFamilyId) {
				throw new Error("No tienes una familia profesional asignada.");
			}

			if (
				!professionalFamilyId ||
				professionalFamilyId !== user.professionalFamilyId
			) {
				throw new Error(
					"No puedes usar familias/ciclos fuera de tu familia profesional.",
				);
			}
		}

		const key = `${professionalFamilyId ?? "null"}::${rawTarget.cicloFormativoId ?? "null"}::${autonomousCommunityId ?? "null"}::${provinceId ?? "null"}::${fpCenterId ?? "null"}`;
		normalized.set(key, {
			autonomousCommunityId,
			provinceId,
			fpCenterId,
			professionalFamilyId,
			cicloFormativoId: rawTarget.cicloFormativoId,
		});
	}

	return [...normalized.values()];
}

async function ensureNoOpenInteractionConflicts(
	contactId: string,
	status: string,
	targets: Array<{
		professionalFamilyId: string | null;
		cicloFormativoId: string | null;
	}>,
	interactionToIgnore?: string,
) {
	if (
		!OPEN_INTERACTION_STATUSES.includes(
			status as (typeof OPEN_INTERACTION_STATUSES)[number],
		)
	) {
		return;
	}

	const cicloIdsToCheck = [
		...new Set(
			targets
				.map((target) => target.cicloFormativoId)
				.filter((value): value is string => Boolean(value)),
		),
	];

	if (cicloIdsToCheck.length === 0) return;

	const supabase = await createClient();
	let query = supabase
		.from("interactions")
		.select("id,interaction_targets(ciclo_formativo_id)")
		.eq("contact_id", contactId)
		.in("status", OPEN_INTERACTION_STATUSES);

	if (interactionToIgnore) {
		query = query.neq("id", interactionToIgnore);
	}

	const { data, error } = await query;
	if (error) throw new Error(error.message);

	const openedCycleIds = new Set<string>();
	for (const row of data ?? []) {
		for (const target of (row.interaction_targets as
			| Array<{ ciclo_formativo_id: string | null }>
			| null
			| undefined) ?? []) {
			if (target.ciclo_formativo_id) {
				openedCycleIds.add(target.ciclo_formativo_id);
			}
		}
	}

	for (const cicloId of cicloIdsToCheck) {
		if (openedCycleIds.has(cicloId)) {
			throw new Error(
				"Ya existe una interacción abierta para alguno de los ciclos seleccionados con este contacto.",
			);
		}
	}
}

async function replaceInteractionTargets(
	interactionId: string,
	targets: Array<{
		autonomousCommunityId: string | null;
		provinceId: string | null;
		fpCenterId: string | null;
		professionalFamilyId: string | null;
		cicloFormativoId: string | null;
	}>,
) {
	const supabase = await createClient();

	const { error: deleteError } = await supabase
		.from("interaction_targets")
		.delete()
		.eq("interaction_id", interactionId);

	if (deleteError) throw new Error(deleteError.message);
	if (targets.length === 0) return;

	const payload = targets.map((target) => ({
		interaction_id: interactionId,
		autonomous_community_id: target.autonomousCommunityId,
		province_id: target.provinceId,
		fp_center_id: target.fpCenterId,
		professional_family_id: target.professionalFamilyId,
		ciclo_formativo_id: target.cicloFormativoId,
	}));

	const { error: insertError } = await supabase
		.from("interaction_targets")
		.insert(payload);

	if (insertError) throw new Error(insertError.message);
}

async function ensureTutorCanUseTargets(
	user: FakeAuthUser,
	targets: Array<{
		professionalFamilyId: string | null;
		cicloFormativoId: string | null;
	}>,
) {
	if (user.role !== "tutor") return;
	if (targets.length === 0) return;
	if (!user.professionalFamilyId) {
		throw new Error("No tienes una familia profesional asignada.");
	}

	for (const target of targets) {
		if (target.professionalFamilyId !== user.professionalFamilyId) {
			throw new Error("No puedes usar ciclos fuera de tu familia profesional.");
		}
	}
}

export async function createInteractionForContact(
	contactId: string,
	formData: FormData,
) {
	const user = await requireWritePermission();
	await ensureTutorCanAccessContact(user, contactId);
	const supabase = await createClient();

	const { data: contact, error: contactError } = await supabase
		.from("contacts")
		.select("id,organization_id,enterprise_id,is_deleted")
		.eq("id", contactId)
		.limit(1)
		.maybeSingle();

	if (contactError) throw new Error(contactError.message);
	if (!contact || contact.is_deleted === true) {
		throw new Error("El contacto no existe o está eliminado.");
	}

	const contactOrganizationId =
		(contact.organization_id as string | null) ?? null;
	const contactEnterpriseId = (contact.enterprise_id as string | null) ?? null;

	const type = String(formData.get("type") ?? "").trim();
	if (!INTERACTION_TYPE_SET.has(type as InteractionType)) {
		throw new Error("Interaction type is invalid");
	}

	const rawTargets = readInteractionTargets(formData);
	const targets = await normalizeInteractionTargets(user, rawTargets);
	await ensureTutorCanUseTargets(user, targets);
	const status = readInteractionStatus(formData);
	const requestedStudents = readRequestedStudents(formData, status);
	await ensureNoOpenInteractionConflicts(contactId, status, targets);

	const primaryCicloId =
		targets.find((target) => target.cicloFormativoId)?.cicloFormativoId ?? null;

	const payload = {
		organization_id: contactOrganizationId,
		enterprise_id: contactEnterpriseId,
		contact_id: contactId,
		type,
		notes: asNullable(formData.get("notes")),
		occurred_at: asIsoDateTime(asNullable(formData.get("occurred_at"))),
		user_id: user.userId,
		ciclo_formativo_id: primaryCicloId,
		status,
		requested_students: requestedStudents,
	};

	const { data: interaction, error } = await supabase
		.from("interactions")
		.insert(payload)
		.select("id")
		.single();
	if (error) throw new Error(error.message);

	await replaceInteractionTargets(interaction.id as string, targets);

	revalidatePath(`/contacts/${contactId}`);
	revalidatePath("/contacts");
}

export async function updateInteractionForContact(
	contactId: string,
	interactionId: string,
	formData: FormData,
) {
	const user = await requireWritePermission();
	await ensureTutorCanAccessContact(user, contactId);
	const supabase = await createClient();

	const type = String(formData.get("type") ?? "").trim();
	if (!INTERACTION_TYPE_SET.has(type as InteractionType)) {
		throw new Error("Interaction type is invalid");
	}

	const status = readInteractionStatus(formData);
	const rawTargets = readInteractionTargets(formData);
	const targets = await normalizeInteractionTargets(user, rawTargets);
	await ensureTutorCanUseTargets(user, targets);
	const requestedStudents = readRequestedStudents(formData, status);
	await ensureNoOpenInteractionConflicts(
		contactId,
		status,
		targets,
		interactionId,
	);

	const primaryCicloId =
		targets.find((target) => target.cicloFormativoId)?.cicloFormativoId ?? null;

	const payload = {
		type,
		notes: asNullable(formData.get("notes")),
		occurred_at: asIsoDateTime(asNullable(formData.get("occurred_at"))),
		ciclo_formativo_id: primaryCicloId,
		status,
		requested_students: requestedStudents,
	};

	const { error } = await supabase
		.from("interactions")
		.update(payload)
		.eq("id", interactionId)
		.eq("contact_id", contactId);

	if (error) throw new Error(error.message);

	await replaceInteractionTargets(interactionId, targets);

	revalidatePath(`/contacts/${contactId}`);
	revalidatePath("/contacts");
}

export async function deleteInteractionForContact(
	contactId: string,
	interactionId: string,
) {
	const user = await requireFakeUser();
	const supabase = await createClient();

	const { data: interaction, error: interactionError } = await supabase
		.from("interactions")
		.select("id,user_id")
		.eq("id", interactionId)
		.eq("contact_id", contactId)
		.limit(1)
		.maybeSingle();

	if (interactionError) throw new Error(interactionError.message);
	if (!interaction) throw new Error("La interacción no existe.");

	if (
		!canDeleteRecordByCreator(
			user,
			(interaction.user_id as string | null) ?? null,
		)
	) {
		throw new Error(
			"No puedes eliminar esta interacción porque no fue creada por ti.",
		);
	}

	const { error } = await supabase
		.from("interactions")
		.delete()
		.eq("id", interactionId)
		.eq("contact_id", contactId);

	if (error) throw new Error(error.message);

	revalidatePath(`/contacts/${contactId}`);
	revalidatePath("/contacts");
}

export async function deleteContact(contactId: string) {
	const user = await requireFakeUser();
	const supabase = await createClient();

	const { data: contact, error: contactError } = await supabase
		.from("contacts")
		.select("id,created_by")
		.eq("id", contactId)
		.limit(1)
		.maybeSingle();

	if (contactError) throw new Error(contactError.message);
	if (!contact) throw new Error("El contacto no existe.");

	if (
		!canDeleteRecordByCreator(
			user,
			(contact.created_by as string | null) ?? null,
		)
	) {
		throw new Error(
			"No puedes eliminar este contacto porque no fue creado por ti.",
		);
	}

	const { error } = await supabase
		.from("contacts")
		.update({ is_deleted: true })
		.eq("id", contactId);

	if (error) throw new Error(error.message);

	revalidatePath("/contacts");
	redirect("/contacts");
}

export async function updateContact(contactId: string, formData: FormData) {
	const user = await requireWritePermission();
	const supabase = await createClient();

	const name = String(formData.get("name") ?? "").trim();
	if (!name) {
		throw new Error("El nombre del contacto es obligatorio.");
	}

	const organizationId = asNullable(formData.get("organization_id"));
	const enterpriseId = asNullable(formData.get("enterprise_id"));

	let resolvedOrganizationId = organizationId;

	if (enterpriseId) {
		const { data: enterprise, error: enterpriseError } = await supabase
			.from("enterprises")
			.select("id,organization_id,is_deleted")
			.eq("id", enterpriseId)
			.limit(1)
			.maybeSingle();

		if (enterpriseError) throw new Error(enterpriseError.message);
		if (!enterprise || enterprise.is_deleted === true) {
			throw new Error("La empresa seleccionada no existe o está eliminada.");
		}

		const parentOrganizationId =
			(enterprise.organization_id as string | null) ?? null;
		if (organizationId !== parentOrganizationId) {
			if (parentOrganizationId) {
				throw new Error(
					"El Grupo empresarial debe coincidir con el grupo al que pertenece la Empresa seleccionada.",
				);
			}

			throw new Error(
				"La Empresa seleccionada no pertenece a ningún Grupo empresarial y no permite asignar uno manualmente.",
			);
		}

		resolvedOrganizationId = parentOrganizationId;
	} else if (organizationId) {
		const { data: organization, error: organizationError } = await supabase
			.from("organizations")
			.select("id,is_deleted")
			.eq("id", organizationId)
			.limit(1)
			.maybeSingle();

		if (organizationError) throw new Error(organizationError.message);
		if (!organization || organization.is_deleted === true) {
			throw new Error(
				"El Grupo empresarial seleccionado no existe o está eliminado.",
			);
		}
	}

	const payload = {
		name,
		position: asNullable(formData.get("position")),
		phone: asNullable(formData.get("phone")),
		second_phone: asNullable(formData.get("second_phone")),
		email: asNullable(formData.get("email")),
		organization_id: resolvedOrganizationId,
		enterprise_id: enterpriseId,
		updated_by: user.userId,
	};

	const { error } = await supabase
		.from("contacts")
		.update(payload)
		.eq("id", contactId);

	if (error) throw new Error(error.message);

	revalidatePath(`/contacts/${contactId}`);
	revalidatePath("/contacts");
}
