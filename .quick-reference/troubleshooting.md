# Troubleshooting

## Pairing fails

- Use Chrome or Edge on desktop or Android.
- Ensure the page is served from HTTPS or `localhost`.
- Confirm the ESP32 advertises the service UUID.

## No audio in

- Verify the ESP32 sends 16 kHz, 16-bit PCM frames.
- Confirm notifications are enabled on the characteristic.

## No audio out

- Check that the Gemini API key is valid.
- Ensure your browser allows audio playback (autoplay policies).
- Watch the console for Gemini Live errors.

## Logo not loading

- Place the logo at `public/images/logo.png`.
- Restart the dev server after adding public assets.
