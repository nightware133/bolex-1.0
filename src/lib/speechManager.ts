/**
 * Global Web Speech Synthesis Manager for Bolex AI
 * Manages audio narration state, auto-narration, voice selection, and playback controls.
 */

import { cleanTextForSpeech, getStoredSpeechSettings, saveStoredSpeechSettings } from './speech';

export type SpeechStatus = 'idle' | 'speaking' | 'paused';

export interface SpeechState {
  currentMessageId: string | null;
  status: SpeechStatus;
  rate: number;
  pitch: number;
  voiceURI: string;
  autoNarrate: boolean;
}

type Listener = (state: SpeechState) => void;

class SpeechManager {
  private listeners: Set<Listener> = new Set();
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentRawText: string | null = null;
  private timer: any = null;

  private state: SpeechState = {
    currentMessageId: null,
    status: 'idle',
    rate: 1.0,
    pitch: 1.0,
    voiceURI: '',
    autoNarrate: false,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = getStoredSpeechSettings();
      this.state.rate = typeof stored.rate === 'number' ? Math.max(0.5, Math.min(2.5, stored.rate)) : 1.0;
      this.state.pitch = stored.pitch || 1.0;
      this.state.voiceURI = stored.voiceURI || '';
      this.state.autoNarrate = Boolean(stored.autoNarrate);

      // Handle window unload
      window.addEventListener('beforeunload', () => {
        this.stop();
      });
    }
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l(this.state));
  }

  public getState(): SpeechState {
    return { ...this.state };
  }

  /**
   * Set the read narration speed/pace (clamped between 0.5x and 2.5x).
   * If speech is actively running, restarts with the newly selected speed immediately.
   */
  public setReadSpeed(speed: number) {
    const clamped = Math.max(0.5, Math.min(2.5, Math.round(speed * 100) / 100));
    this.state.rate = clamped;
    saveStoredSpeechSettings({
      rate: this.state.rate,
      pitch: this.state.pitch,
      voiceURI: this.state.voiceURI,
      autoNarrate: this.state.autoNarrate,
    });
    this.notify();

    // If currently speaking, restart live utterance with the new pace seamlessly
    if (this.state.status === 'speaking' && this.state.currentMessageId && this.currentRawText) {
      this.speak(this.state.currentMessageId, this.currentRawText, clamped);
    }
  }

  /**
   * Alias for setReadSpeed to preserve backward compatibility.
   */
  public setRate(rate: number) {
    this.setReadSpeed(rate);
  }

  /**
   * Get the current read narration speed
   */
  public getReadSpeed(): number {
    return this.state.rate;
  }

  public setVoiceURI(uri: string) {
    this.state.voiceURI = uri;
    saveStoredSpeechSettings({
      rate: this.state.rate,
      pitch: this.state.pitch,
      voiceURI: this.state.voiceURI,
      autoNarrate: this.state.autoNarrate,
    });
    this.notify();
  }

  public setAutoNarrate(enabled: boolean) {
    this.state.autoNarrate = enabled;
    saveStoredSpeechSettings({
      rate: this.state.rate,
      pitch: this.state.pitch,
      voiceURI: this.state.voiceURI,
      autoNarrate: this.state.autoNarrate,
    });
    this.notify();
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isSupported()) return [];
    return window.speechSynthesis.getVoices();
  }

  public speak(messageId: string, rawText: string, customRate?: number) {
    if (!this.isSupported()) return;

    this.stop();

    const clean = cleanTextForSpeech(rawText);
    if (!clean) return;

    this.currentRawText = rawText;

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      const rateToUse = customRate ?? this.state.rate;
      utterance.rate = rateToUse;
      utterance.pitch = this.state.pitch;

      // Select voice
      const voices = this.getVoices();
      if (voices.length > 0) {
        let voice: SpeechSynthesisVoice | undefined;
        if (this.state.voiceURI) {
          voice = voices.find((v) => v.voiceURI === this.state.voiceURI);
        }
        if (!voice) {
          voice = voices.find(
            (v) =>
              (v.name.includes('Google') ||
                v.name.includes('Natural') ||
                v.name.includes('Samantha') ||
                v.name.includes('Daniel') ||
                v.name.includes('Jenny') ||
                v.name.includes('Guy')) &&
              v.lang.startsWith('en')
          ) || voices.find((v) => v.lang.startsWith('en')) || voices[0];
        }
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => {
        this.state.currentMessageId = messageId;
        this.state.status = 'speaking';
        this.notify();

        // Chrome garbage collection workaround for long speech:
        // periodically invoke pause & resume
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
          if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 12000);
      };

      utterance.onend = () => {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        this.state.currentMessageId = null;
        this.state.status = 'idle';
        this.currentUtterance = null;
        this.currentRawText = null;
        this.notify();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
        this.state.currentMessageId = null;
        this.state.status = 'idle';
        this.currentUtterance = null;
        this.currentRawText = null;
        this.notify();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to start speech synthesis:', err);
      this.stop();
    }
  }

  public pause() {
    if (!this.isSupported()) return;
    if (this.state.status === 'speaking') {
      window.speechSynthesis.pause();
      this.state.status = 'paused';
      this.notify();
    }
  }

  public resume() {
    if (!this.isSupported()) return;
    if (this.state.status === 'paused') {
      window.speechSynthesis.resume();
      this.state.status = 'speaking';
      this.notify();
    }
  }

  public stop() {
    if (!this.isSupported()) return;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    this.currentUtterance = null;
    this.currentRawText = null;
    this.state.currentMessageId = null;
    this.state.status = 'idle';
    this.notify();
  }
}

export const speechManager = new SpeechManager();
