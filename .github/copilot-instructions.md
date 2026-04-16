# Copilot Instructions

## Constants Placement

- Do not define reusable domain constants inside `app/**/page.tsx`, `app/**/components/*.tsx`, or server actions when they can be shared.
- Place contact-domain constants in `lib/contacts/constants.ts`.
- Place Spanish UI labels/options for contacts in `lib/contacts/labels.es.ts`.
- Reuse these exports across pages, components, and actions instead of duplicating literals.

## Types And Utils Placement

- Do not keep reusable helpers in `app/**/page.tsx`, `app/**/components/*.tsx`, or server actions.
- Place reusable contact helpers in `lib/contacts/*` (for example `datetime.ts`, `form-utils.ts`).
- Keep component-local `Props` types in the component file when they are not reused.
- Move reused UI types to `lib/contacts/ui-types.ts` and import them from components/pages.

## Contacts Domain Exports

- Use `OPEN_INTERACTION_STATUSES` / `OPEN_INTERACTION_STATUS_SET` from `lib/contacts/constants.ts`.
- Use `INTERACTION_TYPE_SET` and `INTERACTION_STATUS_SET` for validation in server actions.
- Use `INTERACTION_TYPE_OPTIONS_ES`, `INTERACTION_STATUS_OPTIONS_ES`, and `INTERACTION_STATUS_LABELS_ES` from `lib/contacts/labels.es.ts` for UI rendering.

## Execution Policy

- Do not run `lint`, `eslint`, `tsc`, or type-check commands unless the user explicitly asks for it.
