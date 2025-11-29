import React from "react";

type Leader = {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string | null;
  initial?: string;          // fallback if no avatar
  posts: number;
  likes: number;
};

function RankIcon({ rank }: { rank: number }) {
  const map: Record<number, string> = { 1: "🏆", 2: "🥈", 3: "🥉" };
  return <span className="text-xl">{map[rank] ?? `${rank}`}</span>;
}

function Badge({ text }: { text: string }) {
  return (
    <span className="ml-2 rounded-full bg-neutral-900/5 px-2.5 py-1 text-xs font-medium text-neutral-700">
      {text}
    </span>
  );
}

function Avatar({
  url,
  initial,
  alt,
}: {
  url?: string | null;
  initial?: string;
  alt: string;
}) {
  return url ? (
    <img
      src={url}
      alt={alt}
      className="h-11 w-11 rounded-full object-cover ring-2 ring-white"
    />
  ) : (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700 ring-2 ring-white">
      {initial ?? alt[0]}
    </div>
  );
}

function LeaderRow({ rank, user }: { rank: number; user: Leader }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/70 px-5 py-4 shadow-sm ring-1 ring-neutral-200/60 hover:ring-neutral-300 transition">
      <div className="flex items-center justify-between gap-4">
        {/* left cluster */}
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
            <RankIcon rank={rank} />
          </div>

          <Avatar url={user.avatarUrl} initial={user.initial} alt={user.name} />

          <div className="min-w-0">
            <div className="flex items-center">
              <p className="truncate text-base font-semibold text-neutral-900">
                {user.name}
              </p>
              {rank <= 3 && <Badge text={`Top ${rank}`} />}
            </div>
            <p className="truncate text-sm text-neutral-500">{user.handle}</p>
          </div>
        </div>

        {/* right stats */}
        <div className="text-right leading-tight">
          <div className="text-2xl font-bold">{user.posts}</div>
          <div className="text-xs text-neutral-500">posts</div>
          <div className="mt-2 text-sm text-neutral-600">{user.likes} likes</div>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [leaders, setLeaders] = React.useState<Leader[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/leaderboard");
        const data = await res.json();
        setLeaders(data);
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="px-4 pb-12 pt-6 md:px-8">
      {/* header */}
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <p className="mt-2 text-neutral-600">
          Top contributors to our nature photography community
        </p>
      </header>

      {/* list */}
      {loading ? (
        <p className="text-neutral-500">Loading leaderboard...</p>
      ) : (
        <div className="space-y-4">
          {leaders.map((u, i) => (
            <LeaderRow key={u.id} rank={i + 1} user={u} />
          ))}
        </div>
      )}
    </div>
  );
}
