export function toDatetimeLocal(value: string | Date): string {
	const date = value instanceof Date ? value : new Date(value);
	const tzOffsetMs = date.getTimezoneOffset() * 60_000;
	return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

export function nowAsDatetimeLocal(): string {
	return toDatetimeLocal(new Date());
}
