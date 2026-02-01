import { useState, useEffect, useCallback, useRef } from "react";

export const BASS_BOOST_PRESETS = [
  { name: "Default", gain: 5 },
  { name: "High", gain: 10 },
  { name: "Very High", gain: 20 },
  { name: "Insane", gain: 30 },
  { name: "Custom", gain: 0 },
] as const;

export type BassBoostPreset = (typeof BASS_BOOST_PRESETS)[number];
export type BassBoostPresetName = BassBoostPreset["name"];

const LOWSHELF_FREQ = 800;

// WebKit fallback for AudioContext
const getAudioContext = (): typeof AudioContext => {
  return window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
};

export function useBassBoost() {
  const [enabled, setEnabled] = useState(false);
  const [preset, setPreset] = useState<BassBoostPresetName>("Default");
  const [customGain, setCustomGain] = useState(5);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const connectedVideoRef = useRef<HTMLVideoElement | null>(null);

  // Function to connect a video element to the audio graph
  const connectVideo = useCallback((videoElement: HTMLVideoElement) => {
    // If already connected to this video, skip
    if (connectedVideoRef.current === videoElement && audioContextRef.current) {
      return;
    }

    // Clean up previous connection if exists
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceNodeRef.current = null;
      bassFilterRef.current = null;
    }

    try {
      // Create AudioContext with WebKit fallback
      const AudioContextClass = getAudioContext();
      audioContextRef.current = new AudioContextClass();

      // Create MediaElementSource from video
      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(videoElement);

      // Create BiquadFilter for bass boost (lowshelf at 800 Hz)
      bassFilterRef.current = audioContextRef.current.createBiquadFilter();
      bassFilterRef.current.type = "lowshelf";
      bassFilterRef.current.frequency.value = LOWSHELF_FREQ;

      // Apply initial gain based on current state
      if (enabled) {
        const presetObj = BASS_BOOST_PRESETS.find((p) => p.name === preset);
        const gain = preset === "Custom" ? customGain : (presetObj?.gain ?? 5);
        bassFilterRef.current.gain.value = gain;
      } else {
        bassFilterRef.current.gain.value = 0;
      }

      // Connect: source -> filter -> destination
      sourceNodeRef.current.connect(bassFilterRef.current);
      bassFilterRef.current.connect(audioContextRef.current.destination);

      // Resume AudioContext for browser autoplay policy compliance
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      connectedVideoRef.current = videoElement;
    } catch (error) {
      console.error("Failed to connect video to bass boost audio graph:", error);
    }
  }, [enabled, preset, customGain]);

  // Effect to apply gain changes when enabled/preset/customGain changes
  useEffect(() => {
    if (bassFilterRef.current) {
      if (enabled) {
        const presetObj = BASS_BOOST_PRESETS.find((p) => p.name === preset);
        const gain = preset === "Custom" ? customGain : (presetObj?.gain ?? 5);
        bassFilterRef.current.gain.value = gain;
      } else {
        bassFilterRef.current.gain.value = 0;
      }
    }
  }, [enabled, preset, customGain]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        sourceNodeRef.current = null;
        bassFilterRef.current = null;
        connectedVideoRef.current = null;
      }
    };
  }, []);

  // Function to disconnect the current video
  const disconnectVideo = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceNodeRef.current = null;
      bassFilterRef.current = null;
      connectedVideoRef.current = null;
    }
  }, []);

  // Get current effective gain value
  const getCurrentGain = useCallback(() => {
    if (!enabled) return 0;
    const presetObj = BASS_BOOST_PRESETS.find((p) => p.name === preset);
    return preset === "Custom" ? customGain : (presetObj?.gain ?? 5);
  }, [enabled, preset, customGain]);

  return {
    enabled,
    setEnabled,
    preset,
    setPreset,
    customGain,
    setCustomGain,
    connectVideo,
    disconnectVideo,
    getCurrentGain,
    isConnected: connectedVideoRef.current !== null,
    PRESETS: BASS_BOOST_PRESETS,
  };
}
