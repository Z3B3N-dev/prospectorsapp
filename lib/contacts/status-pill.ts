import type { InteractionStatus } from "./types";

export const INTERACTION_STATUS_PILL_CLASSNAMES: Record<
	InteractionStatus,
	string
> = {
	unknown:
		"bg-gray-100 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700",
	contacted:
		"bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:ring-blue-800",
	interested:
		"bg-cyan-100 text-cyan-800 ring-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-200 dark:ring-cyan-800",
	not_interested:
		"bg-rose-100 text-rose-800 ring-rose-200 dark:bg-rose-900/50 dark:text-rose-200 dark:ring-rose-800",
	agreement_reached:
		"bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-900/50 dark:text-amber-200 dark:ring-amber-800",
	hired:
		"bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-200 dark:ring-emerald-800",
	do_not_contact:
		"bg-zinc-200 text-zinc-800 ring-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:ring-zinc-600",
};
