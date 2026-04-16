import { INTERACTION_STATUS_LABELS_ES } from "@/lib/contacts/labels.es";
import { INTERACTION_STATUS_PILL_CLASSNAMES } from "@/lib/contacts/status-pill";
import type { InteractionStatus } from "@/lib/contacts/types";

type Props = {
	status: InteractionStatus;
	size?: "sm" | "md";
};

export function InteractionStatusPill({ status, size = "md" }: Props) {
	return (
		<span
			className={`inline-flex items-center rounded-full ring-1 ring-inset font-medium ${
				size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
			} ${INTERACTION_STATUS_PILL_CLASSNAMES[status]}`}
		>
			{INTERACTION_STATUS_LABELS_ES[status]}
		</span>
	);
}
