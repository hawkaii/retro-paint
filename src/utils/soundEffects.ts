// Retro Sound Effects System for MS Paint++
// Generates authentic 8-bit style sounds using Web Audio API

export class RetroSoundEngine {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private masterVolume: number = 0.1; // Keep sounds subtle

  constructor() {
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      // Create AudioContext with fallback for older browsers
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.audioContext = null;
    }
  }

  private async ensureAudioContext() {
    if (!this.audioContext) return false;

    // Resume AudioContext if suspended (required by browser autoplay policies)
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
        return false;
      }
    }

    return true;
  }

  // Generate classic 8-bit blip sound
  private createBlipSound(frequency: number = 800, duration: number = 0.1) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Square wave for authentic 8-bit sound
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Quick attack and decay envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play sound
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate classic console beep
  private createBeepSound(frequency: number = 1200, duration: number = 0.08) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Sawtooth wave for different texture
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Sharp attack, quick decay
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.8, this.audioContext.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate arcade-style chirp
  private createChirpSound(startFreq: number = 600, endFreq: number = 1000, duration: number = 0.12) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'triangle';
    
    // Frequency sweep for chirp effect
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(endFreq, this.audioContext.currentTime + duration * 0.7);

    // Envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.6, this.audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate low-fi synth pop
  private createPopSound(frequency: number = 500, duration: number = 0.06) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Quick pop envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.9, this.audioContext.currentTime + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate retro click sound
  private createClickSound(frequency: number = 1500, duration: number = 0.05) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Very sharp click
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.masterVolume * 0.7, this.audioContext.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Main method to play random retro sound
  public async playRetroSound(soundType?: 'click' | 'tool' | 'action' | 'error' | 'success') {
    if (!this.isEnabled || !(await this.ensureAudioContext())) return;

    try {
      // Different sound sets for different contexts
      switch (soundType) {
        case 'click':
          // UI click sounds
          const clickSounds = [
            () => this.createClickSound(1500, 0.05),
            () => this.createPopSound(800, 0.06),
            () => this.createBlipSound(1200, 0.07),
          ];
          clickSounds[Math.floor(Math.random() * clickSounds.length)]();
          break;

        case 'tool':
          // Tool selection sounds
          const toolSounds = [
            () => this.createBeepSound(1000, 0.08),
            () => this.createChirpSound(700, 1100, 0.1),
            () => this.createBlipSound(900, 0.09),
          ];
          toolSounds[Math.floor(Math.random() * toolSounds.length)]();
          break;

        case 'action':
          // Drawing action sounds
          const actionSounds = [
            () => this.createPopSound(600, 0.08),
            () => this.createBlipSound(750, 0.1),
            () => this.createChirpSound(500, 800, 0.12),
          ];
          actionSounds[Math.floor(Math.random() * actionSounds.length)]();
          break;

        case 'error':
          // Error sounds (lower frequency, longer)
          const errorSounds = [
            () => this.createBeepSound(400, 0.15),
            () => this.createChirpSound(600, 300, 0.2),
          ];
          errorSounds[Math.floor(Math.random() * errorSounds.length)]();
          break;

        case 'success':
          // Success sounds (higher frequency, pleasant)
          const successSounds = [
            () => this.createChirpSound(800, 1400, 0.15),
            () => this.createBlipSound(1100, 0.12),
          ];
          successSounds[Math.floor(Math.random() * successSounds.length)]();
          break;

        default:
          // General random retro sounds
          const generalSounds = [
            () => this.createBlipSound(800 + Math.random() * 400, 0.08 + Math.random() * 0.04),
            () => this.createBeepSound(1000 + Math.random() * 500, 0.06 + Math.random() * 0.06),
            () => this.createChirpSound(600 + Math.random() * 200, 900 + Math.random() * 300, 0.1 + Math.random() * 0.05),
            () => this.createPopSound(500 + Math.random() * 300, 0.05 + Math.random() * 0.03),
            () => this.createClickSound(1200 + Math.random() * 600, 0.04 + Math.random() * 0.03),
          ];
          generalSounds[Math.floor(Math.random() * generalSounds.length)]();
      }
    } catch (error) {
      console.warn('Failed to play retro sound:', error);
    }
  }

  // Control methods
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public isAudioSupported(): boolean {
    return this.audioContext !== null;
  }

  // Cleanup method
  public dispose() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

// Create singleton instance
export const retroSoundEngine = new RetroSoundEngine();

// Convenience functions for common use cases
export const playClickSound = () => retroSoundEngine.playRetroSound('click');
export const playToolSound = () => retroSoundEngine.playRetroSound('tool');
export const playActionSound = () => retroSoundEngine.playRetroSound('action');
export const playErrorSound = () => retroSoundEngine.playRetroSound('error');
export const playSuccessSound = () => retroSoundEngine.playRetroSound('success');
export const playRandomSound = () => retroSoundEngine.playRetroSound();