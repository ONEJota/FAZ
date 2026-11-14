import { initials } from "@/lib/format";

export function Avatar({ name, color, size = 32 }: { name: string; color?: string; size?: number }) {
  return (
    <span
      title={name}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, background: color || "#E6007E", fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ users }: { users: { name: string; color: string }[] }) {
  return (
    <span className="flex -space-x-2">
      {users.slice(0, 4).map((u) => (
        <Avatar key={u.name} name={u.name} color={u.color} size={26} />
      ))}
      {users.length > 4 && <span className="ml-3 text-xs text-black/50">+{users.length - 4}</span>}
    </span>
  );
}
