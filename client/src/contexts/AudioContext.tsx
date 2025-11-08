import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AudioContextType {
  currentlyPlayingId: string | null;
  registerPlayer: (id: string, audioElement: HTMLAudioElement) => void;
  unregisterPlayer: (id: string) => void;
  setPlaying: (id: string) => void;
  setPaused: (id: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Map<string, HTMLAudioElement>>(new Map());

  const registerPlayer = useCallback((id: string, audioElement: HTMLAudioElement) => {
    setPlayers((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, audioElement);
      return newMap;
    });
  }, []);

  const unregisterPlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const setPlaying = useCallback((id: string) => {
    // Pause all other players
    players.forEach((audioElement, playerId) => {
      if (playerId !== id && !audioElement.paused) {
        audioElement.pause();
      }
    });
    setCurrentlyPlayingId(id);
  }, [players]);

  const setPaused = useCallback((id: string) => {
    if (currentlyPlayingId === id) {
      setCurrentlyPlayingId(null);
    }
  }, [currentlyPlayingId]);

  return (
    <AudioContext.Provider
      value={{
        currentlyPlayingId,
        registerPlayer,
        unregisterPlayer,
        setPlaying,
        setPaused,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudioContext() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudioContext must be used within AudioProvider");
  }
  return context;
}
