"use client";
import { useState } from 'react';
export default function Settings() {
  const [apiKeys, setApiKeys] = useState<{
    textAI: string;
    imageGeneration: string;
    textToSpeech: string;
    musicSFX: string;
  }>({
    textAI: "",
    imageGeneration: "",
    textToSpeech: "",
    musicSFX: "",
  });

  const handleSave = () => {
    // Save API keys to environment
    // In production, this would write to .env file
    console.log("API keys saved:", apiKeys);
    alert("API keys saved successfully");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">Settings</h1>

      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-medium mb-4">API Configuration</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Text AI Provider
              </label>
              <input
                type="text"
                value={apiKeys.textAI}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, textAI: e.target.value })
                }
                placeholder="Enter your text AI API key"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Image Generation Provider
              </label>
              <input
                type="text"
                value={apiKeys.imageGeneration}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, imageGeneration: e.target.value })
                }
                placeholder="Enter your image generation API key"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Text-to-Speech Provider
              </label>
              <input
                type="text"
                value={apiKeys.textToSpeech}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, textToSpeech: e.target.value })
                }
                placeholder="Enter your TTS API key"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Music/SFX Provider
              </label>
              <input
                type="text"
                value={apiKeys.musicSFX}
                onChange={(e) =>
                  setApiKeys({ ...apiKeys, musicSFX: e.target.value })
                }
                placeholder="Enter your music/SFX API key"
                className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            onClick={handleSave}
            className="btn btn-primary w-full py-3 rounded font-medium transition-colors"
          >
            Save Configuration
          </button>
          <p className="mt-3 text-sm text-gray-400">
            Note: API keys are stored locally. For production, use environment variables.
          </p>
        </div>
      </div>
    </div>
  );
}


