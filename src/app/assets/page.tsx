export default function Assets() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Assets Library</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visual Assets */}
        <div className="bg-gray-800 border border-gray-600 rounded p-6">
          <h3 className="text-bold mb-3">Generated Visuals</h3>
          <p>Original AI-generated images for video scenes</p>
          <p className="text-gray-400 text-sm">Total: 0</p>
          <button className="mt-4 btn w-full py-2">Manage Assets</button>
        </div>

        {/* Audio Assets */}
        <div className="bg-gray-800 border border-gray-600 rounded p-6">
          <h3 className="text-bold mb-3">Background Music</h3>
          <p>Copyright-safe music tracks</p>
          <p className="text-gray-400 text-sm">Total: 0</p>
          <button className="mt-4 btn w-full py-2">Manage Music</button>
        </div>

        {/* SFX Library */}
        <div className="bg-gray-800 border border-gray-600 rounded p-6">
          <h3 className="text-bold mb-3">Sound Effects</h3>
          <p>Memes-style sound effects library</p>
          <p className="text-gray-400 text-sm">Total: 0</p>
          <button className="mt-4 btn w-full py-2">Manage SFX</button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-medium mb-4">Copyright Safety</h2>
        <p className="text-gray-400">
          All assets are AI-generated or copyright-safe. No unauthorized movie clips,
          TV footage, or other creators&apos; content is used.
        </p>
      </div>
    </div>
  );
}