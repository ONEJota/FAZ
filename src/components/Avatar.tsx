import { initials } from "@/lib/format";
import { avatarUrl, type AvatarUser } from "@/lib/avatar";

/**
 * Avatar da pessoa: o personagem que ela montou (ou as iniciais), com o anel na cor
 * escolhida e o emoji de status no canto.
 */
export function Avatar({ user, size = 32, emoji }: { user: AvatarUser; size?: number; emoji?: boolean }) {
  const ring = user.color || "#f10a64";
  const showEmoji = (emoji ?? size >= 30) && !!user.statusEmoji;
  const badge = Math.min(size * 0.48, 42);
  return (
    <span title={user.name} className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className="inline-flex h-full w-full items-center justify-center overflow-hidden rounded-full font-bold text-white"
        style={{ background: user.avatarStyle ? "#fff" : ring, boxShadow: `0 0 0 2px #fff, 0 0 0 ${size >= 30 ? 4 : 3}px ${ring}`, fontSize: size * 0.38 }}
      >
        {user.avatarStyle && user.avatarSeed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl(user.avatarStyle, user.avatarSeed, user.avatarBg)} alt="" width={size} height={size} className="h-full w-full" loading="lazy" />
        ) : (
          initials(user.name)
        )}
      </span>
      {showEmoji && (
        <span
          className="absolute flex items-center justify-center rounded-full bg-white leading-none shadow"
          style={{ width: badge, height: badge, fontSize: badge * 0.62, right: -badge * 0.15, bottom: -badge * 0.1 }}
          aria-label={`status ${user.statusEmoji}`}
        >
          {user.statusEmoji}
        </span>
      )}
    </span>
  );
}

export function AvatarStack({ users }: { users: AvatarUser[] }) {
  return (
    <span className="flex items-center -space-x-1.5">
      {users.slice(0, 4).map((u) => (
        <Avatar key={u.name} user={u} size={26} />
      ))}
      {users.length > 4 && <span className="ml-3 text-xs text-black/50">+{users.length - 4}</span>}
    </span>
  );
}
