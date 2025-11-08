import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

interface AudioPlayerContextType {
  currentlyPlayingId: number | null;
  requestPlay: (trackId: number, trackTitle: string) => boolean;
  stopPlaying: (trackId: number) => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentlyPlayingId, setCurrentlyPlayingId] = useState<number | null>(null);

  const requestPlay = (trackId: number, trackTitle: string): boolean => {
    // If another track is playing, show notification and deny
    if (currentlyPlayingId !== null && currentlyPlayingId !== trackId) {
      toast.info("Please pause the current track before playing another", {
        description: "Only one track can play at a time",
        duration: 3000,
      });
      return false;
    }
    
    // Allow this track to play
    setCurrentlyPlayingId(trackId);
    return true;
  };

  const stopPlaying = (trackId: number) => {
    // Only clear if this track is the one currently playing
    if (currentlyPlayingId === trackId) {
      setCurrentlyPlayingId(null);
    }
  };

  return (
    <AudioPlayerContext.Provider value={{ currentlyPlayingId, requestPlay, stopPlaying }}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  }
  return context;
}
