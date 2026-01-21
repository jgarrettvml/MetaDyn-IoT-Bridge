
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class GeminiLiveService {
  private ai: GoogleGenAI | null = null;
  private sessionPromise: Promise<any> | null = null;
  private nextStartTime = 0;
  private outputAudioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private sources = new Set<AudioBufferSourceNode>();

  constructor() {}

  async connect(callbacks: {
    onInputTranscription: (text: string) => void;
    onOutputTranscription: (text: string) => void;
    onTurnComplete: () => void;
    onError: (e: any) => void;
  }) {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        systemInstruction: "You are a voice assistant connected via a hardware bridge. Be concise, friendly, and direct. You are talking to someone through an ESP32 device.",
      },
      callbacks: {
        onopen: () => console.log("Gemini session opened"),
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            callbacks.onInputTranscription(message.serverContent.inputTranscription.text);
          }
          if (message.serverContent?.outputTranscription) {
            callbacks.onOutputTranscription(message.serverContent.outputTranscription.text);
          }
          if (message.serverContent?.turnComplete) {
            callbacks.onTurnComplete();
          }

          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio && this.outputAudioContext) {
            this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
            const audioBuffer = await decodeAudioData(decode(base64Audio), this.outputAudioContext, 24000, 1);
            const source = this.outputAudioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.outputNode!);
            source.start(this.nextStartTime);
            this.nextStartTime += audioBuffer.duration;
            this.sources.add(source);
            source.onended = () => this.sources.delete(source);
          }

          if (message.serverContent?.interrupted) {
            this.sources.forEach(s => s.stop());
            this.sources.clear();
            this.nextStartTime = 0;
          }
        },
        onerror: (e) => callbacks.onError(e),
        onclose: () => console.log("Gemini session closed"),
      }
    });
    return this.sessionPromise;
  }

  sendAudio(data: Int16Array) {
    if (!this.sessionPromise) return;
    const base64 = encode(new Uint8Array(data.buffer));
    this.sessionPromise.then(session => {
      session.sendRealtimeInput({
        media: { data: base64, mimeType: 'audio/pcm;rate=16000' }
      });
    });
  }

  async disconnect() {
    if (this.sessionPromise) {
      const session = await this.sessionPromise;
      session.close();
    }
    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
    }
  }
}

export const geminiLiveService = new GeminiLiveService();
