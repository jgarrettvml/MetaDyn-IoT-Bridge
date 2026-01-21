# Bluetooth Protocol

## Discovery

- Web Bluetooth filter: name prefix `XIAO`.
- Optional service UUID: `19b10000-e8f2-537e-4f6c-d104768a1214`.

## GATT profile

- Service UUID: `19b10000-e8f2-537e-4f6c-d104768a1214`
- Characteristic UUID: `19b10001-e8f2-537e-4f6c-d104768a1214`
- Notifications enabled for streaming audio frames.

## Audio payload

- Format: 16-bit PCM.
- Sample rate: 16 kHz.
- Channel count: 1 (mono).

If your firmware uses a different format or UUIDs, update `services/bluetoothService.ts` and `services/geminiLiveService.ts`.
