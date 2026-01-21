# Architecture

## Frontend

- Vite + React app in the browser.
- Web Bluetooth for device discovery and notifications.
- Gemini Live for streaming transcription and audio synthesis.
- Web Audio API for low-latency playback.

## Runtime flow

1) User clicks Pair.
2) Browser connects to the ESP32 BLE service.
3) BLE notifications deliver PCM frames.
4) PCM is streamed to Gemini Live.
5) Gemini returns audio and transcriptions.
6) UI displays transcripts and plays synthesized audio.

## Key files

- `App.tsx`: UI and orchestration.
- `services/bluetoothService.ts`: BLE connection and notifications.
- `services/geminiLiveService.ts`: Gemini Live session and audio I/O.
- `types.ts`: shared UI types.
