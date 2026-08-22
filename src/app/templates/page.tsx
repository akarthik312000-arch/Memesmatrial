export default function Templates() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Templates</h1>
      <p className="text-gray-400 mb-6">
        Meme video templates for rapid creation. Select a template and customize
        the topic, style, and language to generate a complete 25 or 60-second video.
      </p>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gray-800 border border-gray-600 rounded p-6 hover:border-blue-500 transition-colors">
          <h3 className="text-bold mb-3">Relatable Situation</h3>
          <p>Everyday life moments with unexpected punchlines</p>
          <button className="mt-4 btn w-full py-2">Use Template</button>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded p-6 hover:border-blue-500 transition-colors">
          <h3 className="text-bold mb-3">Work/Office</h3>
          <p>Cubicle humor and workplace scenarios</p>
          <button className="mt-4 btn w-full py-2">Use Template</button>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded p-6 hover:border-blue-500 transition-colors">
          <h3 className="text-bold mb-3">College Life</h3>
          <p>Student experiences and campus culture</p>
          <button className="mt-4 btn w-full py-2">Use Template</button>
        </div>
        <div className="bg-gray-800 border border-gray-600 rounded p-6 hover:border-blue-500 transition-colors">
          <h3 className="text-bold mb-3">Gaming</h3>
          <p>Gamer moments and internet culture</p>
          <button className="mt-4 btn w-full py-2">Use Template</button>
        </div>
      </div>
    </div>
  );
}