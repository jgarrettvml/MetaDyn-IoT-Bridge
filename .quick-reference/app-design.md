# App Design

## Visual theme

- Dark, high-contrast console UI with MetaDyn brand colors.
- Subtle ambient gradients to suggest active signal flow.
- Compact status indicators and waveform-style activity bars.

## UI layout

- Header: logo, project name, BLE status, connect/disconnect action.
- Main panel: empty state, live transcript stream, and AI response stream.
- Footer: animated audio activity bars and a status rail.
- Bottom bar: hardware node and AI gateway status.

## Interaction model

- User action initiates BLE pairing.
- AI session starts immediately after BLE connects.
- Transcripts appear as streaming, ghosted bubbles until a turn completes.
- Conversation history persists in the current session only.
