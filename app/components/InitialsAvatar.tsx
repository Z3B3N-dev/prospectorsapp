const AVATAR_COLORS = [
  "bg-teal-700 text-teal-100",
  "bg-amber-700 text-amber-100",
  "bg-rose-700 text-rose-100",
  "bg-blue-700 text-blue-100",
  "bg-violet-700 text-violet-100",
  "bg-emerald-700 text-emerald-100",
  "bg-orange-700 text-orange-100",
  "bg-cyan-700 text-cyan-100",
];

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function avatarColor(name: string | null): string {
  if (!name) return AVATAR_COLORS[0];
  const code = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

type Props = {
  name: string | null;
  size?: "sm" | "md";
};

export function InitialsAvatar({ name, size = "md" }: Props) {
  const sizeClasses = size === "sm" ? "h-6 w-6 text-xs" : "h-8 w-8 text-xs";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClasses} ${avatarColor(name)}`}
    >
      {getInitials(name)}
    </div>
  );
}
