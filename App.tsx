import React, { useState } from 'react';
import { generateCompanySong } from './services/geminiService';
import { AppState, CompanySong } from './types';
import { Player } from './components/Player';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [songData, setSongData] = useState<CompanySong | null>(null);
  const [error, setError] = useState<string>('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setState(AppState.LOADING);
    setError('');
    try {
      const song = await generateCompanySong(url);
      setSongData(song);
      setState(AppState.READY);
    } catch (err: any) {
      setError(err.message || "Failed to connect.");
      setState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setState(AppState.IDLE);
    setSongData(null);
    setUrl('');
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full text-center">
        
        {/* Reverted Header Style */}
        <h1 className="text-4xl md:text-6xl text-yellow-300 mb-2 underline decoration-wavy decoration-red-500 inline-block px-4">
           Corporate Anthem Generator 
        </h1>
        <p className="text-gray-500 text-xs mb-12 uppercase tracking-widest">
            The Internet's #1 Karaoke Machine (c) 2000
        </p>

        {state !== AppState.READY && (
          <div className="flex flex-col items-center">
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row gap-2 items-center bg-zinc-900 border-2 border-zinc-700 p-4 w-full max-w-lg">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Enter URL (e.g. google.com)"
                    className="w-full bg-black border border-gray-600 text-white px-4 py-2 focus:outline-none focus:border-white rounded-none"
                    disabled={state === AppState.LOADING}
                />
                <button
                    type="submit"
                    disabled={state === AppState.LOADING || !url}
                    className="bg-white hover:bg-gray-200 text-black px-8 py-2 font-black disabled:opacity-50 transition-none whitespace-nowrap"
                >
                    {state === AppState.LOADING ? "WAIT..." : "GO!"}
                </button>
            </form>

            {state === AppState.LOADING && (
                <div className="mt-8 text-green-500 font-mono text-sm animate-pulse">
                    &gt; ACCESSING DATABASE...<br/>
                    &gt; ANALYZING DNA...<br/>
                    &gt; COMPOSING MELODY...
                </div>
            )}

            {error && <div className="mt-4 text-red-500 border border-red-500 p-2 text-xs">{error}</div>}
          </div>
        )}

        {state === AppState.READY && songData && (
            <Player song={songData} onReset={handleReset} />
        )}
        
      </div>
    </div>
  );
};

export default App;