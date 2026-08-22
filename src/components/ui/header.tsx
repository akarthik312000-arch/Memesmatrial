import Link from "next/link";

export const Header = () => {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#100e18]/90 backdrop-blur-xl">
      <div className="flex h-[73px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff625e] to-[#8b5cf6] text-lg font-black text-white shadow-lg shadow-violet-500/20">
            MM
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight md:text-lg">MemesMaterial</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a9a4b7]">Creator studio</p>
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          <span className="rounded-full border border-[#40df86]/30 bg-[#40df86]/10 px-3 py-1.5 text-xs font-bold text-[#72eca6]">● System ready</span>
          <Link href="/settings" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-[#a9a4b7] transition hover:border-white/25 hover:text-white">Settings</Link>
        </div>
        <nav className="hidden">
            <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Dashboard
            </Link>
          <a
            href="/create"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Create Video
          </a>
          <a
            href="/seven-day-batch"
            className="text-gray-400 hover:text-white transition-colors"
          >
            7-Day Batch
          </a>
          <a
            href="/library"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Video Library
          </a>
          <a
            href="/templates"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Templates
          </a>
          <a
            href="/assets"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Assets
          </a>
          <a
            href="/settings"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Settings
          </a>
        </nav>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 md:hidden">
        <Link href="/" className="shrink-0 rounded-lg bg-[#ff625e]/10 px-3 py-2 text-xs font-bold text-white">Dashboard</Link>
        <a href="/create" className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-[#a9a4b7]">Create Video</a>
        <a href="/seven-day-batch" className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-[#a9a4b7]">Batch</a>
        <a href="/meme-image" className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-[#a9a4b7]">Meme</a>
        <a href="/library" className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-[#a9a4b7]">Library</a>
        <a href="/assets" className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-[#a9a4b7]">Assets</a>
        <a href="/settings" className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-[#a9a4b7]">Settings</a>
      </nav>
    </header>
  );
};