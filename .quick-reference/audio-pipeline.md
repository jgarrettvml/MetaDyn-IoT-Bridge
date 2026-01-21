# Audio Pipeline

## Input (device -> Gemini)

- BLE notifications deliver PCM frames.
- Frames are cast to `Int16Array` and base64-encoded.
- Audio is streamed to Gemini Live using `audio/pcm;rate=16000`.

## Output (Gemini -> device)

- Gemini Live returns audio in the response stream.
- Audio is decoded and played via Web Audio at 24 kHz.
- Playback is queued to avoid overlap and minimize gaps.

## Transcription

- Input and output transcription are enabled.
- Partial transcriptions are streamed into the UI before finalizing the turn.
