import Link from "next/link";

export const Sidebar = () => {
  return (
    <aside className="fixed bottom-0 left-0 top-[73px] z-10 hidden w-64 border-r border-white/10 bg-[#14111d]/90 md:block">
      <div className="flex h-full flex-col p-5">
        <p className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#716b7e]">Workspace</p>
        <nav>
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg border-l-2 border-[#ff625e] bg-[#ff625e]/10 px-3 py-3 text-sm font-bold text-white transition-colors"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <a
                href="/create"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Create Video
              </a>
            </li>
            <li>
              <a
                href="/seven-day-batch"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Batch (Unlimited)
              </a>
            </li>
            <li>
              <a
                href="/library"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Video Library
              </a>
            </li>
            <li>
              <a
                href="/meme-image"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Meme
              </a>
            </li>
            <li>
              <a
                href="/editor"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Video Editor
              </a>
            </li>
            <li>
              <a
                href="/templates"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Templates
              </a>
            </li>
            <li>
              <a
                href="/projects"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Projects
              </a>
            </li>
            <li>
              <a
                href="/assets"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Assets
              </a>
            </li>
            <li>
              <a
                href="/analytics"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Analytics
              </a>
            </li>
            <li>
              <a
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#a9a4b7] transition-colors hover:bg-white/5 hover:text-white"
              >
                Settings
              </a>
            </li>
          </ul>
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 bg-gradient-to-br from-[#241d38] to-[#181622] p-4">
          <p className="text-xs font-bold text-white">Build your next hit</p>
          <p className="mt-1 text-xs leading-5 text-[#a9a4b7]">Turn one idea into a ready-to-post short.</p>
          <a href="/create" className="mt-3 block text-xs font-black uppercase tracking-wider text-[#ff8f87]">Start creating →</a>
        </div>
      </div>
    </aside>
  );
};
