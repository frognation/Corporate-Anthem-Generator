import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SongSegment, CompanySong, WordUnit } from '../types';
import { Visualizer } from './Visualizer';

interface PlayerProps {
  song: CompanySong;
  onReset: () => void;
}

export const Player: React.FC<PlayerProps> = ({ song, onReset }) => {
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const synth = useRef<SpeechSynthesis>(window.speechSynthesis);
  const audioCtx = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      setVoices(synth.current.getVoices().filter(v => v.lang.startsWith('en') || v.lang.startsWith('ko')));
    };
    loadVoices();
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }
  }, []);

  const startBGM = () => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtx.current;
    if (ctx.state === 'suspended') ctx.resume();

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(ctx.destination);

    const playTone = (freq: number, time: number, duration: number, type: OscillatorType = 'square') => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, time);
      g.gain.setValueAtTime(0.3, time);
      g.gain.exponentialRampToValueAtTime(0.01, time + duration);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(time);
      osc.stop(time + duration);
    };

    let nextBeatTime = ctx.currentTime;
    const scheduleLoop = () => {
      if (!isPlayingRef.current) return;
      while (nextBeatTime < ctx.currentTime + 0.1) {
        const beat = Math.floor(nextBeatTime * 4) % 16;
        const bass = [55, 55, 65, 55, 73, 55, 49, 55]; // A1, C2, D2, B1
        if (beat % 2 === 0) playTone(bass[(beat/2)%8], nextBeatTime, 0.2, 'sawtooth');
        nextBeatTime += 0.25;
      }
      requestAnimationFrame(scheduleLoop);
    };
    scheduleLoop();
  };

  const stopPlayback = useCallback(() => {
    synth.current.cancel();
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (audioCtx.current) {
      audioCtx.current.close();
      audioCtx.current = null;
    }
  }, []);

  const playSong = useCallback(() => {
    if (voices.length === 0) return;
    isPlayingRef.current = true;
    setIsPlaying(true);
    startBGM();

    const singWord = (lineIdx: number, wordIdx: number) => {
      if (!isPlayingRef.current) return;

      // Check if finished
      if (lineIdx >= song.lyrics.length) {
        setTimeout(stopPlayback, 1000);
        return;
      }

      const currentLine = song.lyrics[lineIdx];
      
      // Move to next line if words exhausted
      if (wordIdx >= currentLine.words.length) {
        setCurrentWordIndex(-1);
        setTimeout(() => singWord(lineIdx + 1, 0), 400); // Line gap
        return;
      }

      setCurrentLineIndex(lineIdx);
      setCurrentWordIndex(wordIdx);

      const word = currentLine.words[wordIdx];
      const utterance = new SpeechSynthesisUtterance(word.text);
      
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Premium')) || voices[0];
      utterance.voice = preferredVoice;
      utterance.pitch = word.pitch;
      utterance.rate = 1.1; // Slightly faster for word chunks

      utterance.onend = () => {
        singWord(lineIdx, wordIdx + 1);
      };

      utterance.onerror = () => stopPlayback();
      synth.current.speak(utterance);
    };

    singWord(0, 0);
  }, [song, voices, stopPlayback]);

  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      playSong();
    }
  };

  const currentPitch = (currentLineIndex >= 0 && currentWordIndex >= 0) 
    ? song.lyrics[currentLineIndex].words[currentWordIndex].pitch 
    : 1;

  return (
    <div className="w-full mt-8 p-4 bg-black border-2 border-white">
      <div className="text-center mb-6">
        <h2 className="text-xl text-green-400 font-bold underline mb-1">
          {song.companyName} Anthem
        </h2>
        <p className="text-xs text-gray-500 italic">"{song.summary}"</p>
      </div>

      <Visualizer isActive={isPlaying} pitch={currentPitch} />

      {/* Karaoke Display */}
      <div className="my-6 p-8 bg-black border-4 border-gray-700 min-h-[160px] flex items-center justify-center relative shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]">
        {currentLineIndex >= 0 ? (
          <div className="text-center">
             <div className="flex flex-wrap justify-center gap-x-3 text-3xl md:text-5xl font-bold uppercase tracking-tight">
               {song.lyrics[currentLineIndex].words.map((w, idx) => (
                 <span 
                  key={idx}
                  className={`transition-colors duration-100 ${idx <= currentWordIndex ? 'text-yellow-400' : 'text-white opacity-40'}`}
                  style={{ textShadow: idx <= currentWordIndex ? '0 0 10px #facc15' : 'none' }}
                 >
                   {w.text}
                 </span>
               ))}
             </div>
          </div>
        ) : (
          <div className="text-gray-600 animate-pulse text-2xl">[ STANDBY ]</div>
        )}
      </div>

      {/* Control Panel */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-4">
          <button
            onClick={togglePlay}
            className={`px-10 py-3 font-bold text-xl border-2 border-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] active:shadow-none active:translate-x-1 active:translate-y-1 ${isPlaying ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          
          <button
            onClick={onReset}
            className="px-6 py-3 font-bold border-2 border-gray-600 text-gray-400 hover:text-white hover:border-white transition-colors"
          >
            NEW SONG
          </button>
        </div>

        <div className="w-full h-1 bg-gray-900 overflow-hidden mt-4">
           {isPlaying && <div className="h-full bg-green-500 animate-[progress_20s_linear_infinite]" style={{ width: '100%' }}></div>}
        </div>
      </div>
    </div>
  );
};