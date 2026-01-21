<div align="center">
<img width="1200" height="475" alt="MetaDyn IoT Bridge" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# MetaDyn IoT Bridge

MetaDyn IoT Bridge is a browser-based control console that pairs to an ESP32 (XIAO ESP32 S3 Sense) over Web Bluetooth, streams live microphone audio to Gemini Live, and plays synthesized audio back in real time. The UI shows connection status, live transcriptions, and the AI response as it streams.

## What it does

- Connects to a BLE peripheral named with the prefix `XIAO`.
- Receives 16-bit PCM audio over BLE notifications.
- Streams audio to Gemini Live with input and output transcription enabled.
- Plays back AI speech in the browser using a low-latency audio pipeline.
- Presents a minimal console UI for pairing and live conversation status.

## Requirements

- Node.js 18+ recommended.
- A Chromium-based browser (Chrome, Edge) with Web Bluetooth enabled.
- HTTPS or `localhost` for Web Bluetooth.
- An ESP32 device running a BLE peripheral that exposes the expected service and characteristic UUIDs.
- A Gemini API key.

## Quick start

1) Install dependencies:

```bash
npm install
```

2) Create `.env.local` and set your key:

```bash
GEMINI_API_KEY=your_api_key_here
```

3) Start the dev server:

```bash
npm run dev
```

4) Open the app, click `Pair XIAO`, and select your ESP32 device.

## BLE contract (ESP32 side)

The app expects:

- Service UUID: `19b10000-e8f2-537e-4f6c-d104768a1214`
- Characteristic UUID: `19b10001-e8f2-537e-4f6c-d104768a1214`
- Notifications delivering 16-bit PCM audio at 16 kHz

If your firmware uses different UUIDs or audio format, update `services/bluetoothService.ts` and `services/geminiLiveService.ts` accordingly.

## Audio pipeline summary

- BLE notifications provide PCM frames (16 kHz, 16-bit).
- Audio is base64-encoded and streamed to Gemini Live.
- Gemini responds with audio; the app decodes PCM and plays it at 24 kHz.

## Project structure

- `App.tsx`: UI, connection flow, and live transcript display.
- `services/bluetoothService.ts`: Web Bluetooth connection and notifications.
- `services/geminiLiveService.ts`: Gemini Live session, audio encode/decode, playback.
- `public/images/logo.png`: App logo.

## Troubleshooting

- Web Bluetooth only works on HTTPS or `localhost` and requires a user gesture.
- If pairing fails, confirm the ESP32 advertises the expected service UUID.
- If audio is choppy, ensure the device is sending consistent 16 kHz PCM frames.
- If the logo is missing, confirm `public/images/logo.png` exists and the dev server restarted.

## Reference docs

More detailed documentation lives in `.quick-reference/`:

- `.quick-reference/app-design.md`
- `.quick-reference/architecture.md`
- `.quick-reference/bluetooth-protocol.md`
- `.quick-reference/audio-pipeline.md`
- `.quick-reference/troubleshooting.md`
- `.quick-reference/ui-reference.md`
