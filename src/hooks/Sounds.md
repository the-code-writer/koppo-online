# Sounds System Documentation

## Overview

This document describes the sound system implementation for the Koppo application. The system uses the `use-sound` React hook library to manage and play audio files located in the `src/assets/sounds/` directory.

## Available Sound Files

The following sound files are available in the application:

### Bot-Related Sounds
- `bot-dead.mp3` - Played when a bot is terminated or crashes
- `bot-error.mp3` - Played when a bot encounters an error
- `bot-loss.mp3` - Played when a bot incurs a loss
- `bot-pause.mp3` - Played when a bot is paused
- `bot-profit.mp3` - Played when a bot makes a profit
- `bot-resume.mp3` - Played when a bot resumes operation
- `bot-start.mp3` - Played when a bot starts running
- `bot-stop-emergency.mp3` - Played for emergency bot stop
- `bot-stop.mp3` - Played when a bot stops normally

### General System Sounds
- `error.mp3` - General error notification sound
- `info.mp3` - Information notification sound
- `success.mp3` - Success notification sound
- `warn.mp3` - Warning notification sound

### Trading-Related Sounds
- `sattle.mp3` - Settlement sound
- `stop-loss.mp3` - Stop loss triggered sound
- `take-profit.mp3` - Take profit triggered sound
- `zone.mp3` - Zone-related sound

## Hook Implementation

### `useSounds` Hook

The `useSounds` hook is located at `src/hooks/useSounds.ts` and provides easy access to all sound files.

#### Features
- **TypeScript Support**: Full TypeScript typing for all sound functions
- **Configurable Options**: Support for volume, playback rate, and interrupt settings
- **Pre-loaded Sounds**: All sounds are pre-loaded for instant playback
- **Consistent API**: Uniform interface for all sound functions

#### Basic Usage

```tsx
import useSounds from '../hooks/useSounds';

function MyComponent() {
  const { playSuccess, playError, playBotStart } = useSounds();

  const handleSuccess = () => {
    playSuccess(); // Plays success sound
  };

  const handleError = () => {
    playError(); // Plays error sound
  };

  const handleBotStart = () => {
    playBotStart(); // Plays bot start sound
  };

  return (
    <div>
      <button onClick={handleSuccess}>Play Success</button>
      <button onClick={handleError}>Play Error</button>
      <button onClick={handleBotStart}>Play Bot Start</button>
    </div>
  );
}
```

#### Advanced Usage with Options

```tsx
import useSounds from '../hooks/useSounds';

function MyComponent() {
  // Configure default options for all sounds
  const sounds = useSounds({
    volume: 0.5,        // Set volume to 50%
    playbackRate: 1.0,  // Normal playback speed
    interrupt: true     // Allow interruption of previous sounds
  });

  const { playSuccess, playError } = sounds;

  return (
    <div>
      <button onClick={playSuccess}>Play Success (50% volume)</button>
      <button onClick={playError}>Play Error (50% volume)</button>
    </div>
  );
}
```

## Available Hook Functions

The `useSounds` hook returns the following functions:

### Bot Functions
- `playBotDead()` - Play bot death sound
- `playBotError()` - Play bot error sound
- `playBotLoss()` - Play bot loss sound
- `playBotPause()` - Play bot pause sound
- `playBotProfit()` - Play bot profit sound
- `playBotResume()` - Play bot resume sound
- `playBotStart()` - Play bot start sound
- `playBotStopEmergency()` - Play emergency stop sound
- `playBotStop()` - Play normal stop sound

### System Functions
- `playError()` - Play general error sound
- `playInfo()` - Play information sound
- `playSuccess()` - Play success sound
- `playWarn()` - Play warning sound

### Trading Functions
- `playSattle()` - Play settlement sound
- `playStopLoss()` - Play stop loss sound
- `playTakeProfit()` - Play take profit sound
- `playZone()` - Play zone sound

## Configuration Options

The hook accepts an optional configuration object:

```typescript
interface SoundOptions {
  volume?: number;        // 0.0 to 1.0 (default: 1.0)
  playbackRate?: number; // 0.5 to 4.0 (default: 1.0)
  interrupt?: boolean;   // Allow interruption (default: false)
}
```

### Option Descriptions

- **volume**: Controls the loudness of the sound (0.0 = silent, 1.0 = full volume)
- **playbackRate**: Controls the speed of playback (0.5 = half speed, 2.0 = double speed)
- **interrupt**: If true, playing a new sound will interrupt any currently playing sound

## Best Practices

### 1. Sound Usage Guidelines

- Use appropriate sounds for different events
- Consider user experience when playing multiple sounds
- Test volume levels across different devices

### 2. Performance Considerations

- Sounds are pre-loaded when the hook is first used
- Avoid creating multiple instances of the useSounds hook unnecessarily
- Consider using the interrupt option for rapid-fire events

### 3. Accessibility

- Always provide visual indicators alongside audio feedback
- Respect user preferences for sound (consider adding a mute option)
- Test with screen readers and other accessibility tools

## Integration Examples

### Bot Status Notifications

```tsx
function BotStatus({ status }: { status: string }) {
  const { playBotStart, playBotStop, playBotError } = useSounds();

  useEffect(() => {
    switch (status) {
      case 'starting':
        playBotStart();
        break;
      case 'stopped':
        playBotStop();
        break;
      case 'error':
        playBotError();
        break;
    }
  }, [status, playBotStart, playBotStop, playBotError]);

  return <div>Bot Status: {status}</div>;
}
```

### Trading Alerts

```tsx
function TradingAlert({ type }: { type: 'profit' | 'loss' | 'warning' }) {
  const { playTakeProfit, playStopLoss, playWarn } = useSounds({
    volume: 0.7,
    interrupt: true
  });

  useEffect(() => {
    switch (type) {
      case 'profit':
        playTakeProfit();
        break;
      case 'loss':
        playStopLoss();
        break;
      case 'warning':
        playWarn();
        break;
    }
  }, [type, playTakeProfit, playStopLoss, playWarn]);

  return <div>Alert: {type}</div>;
}
```

## File Structure

```
src/
├── assets/
│   └── sounds/
│       ├── bot-dead.mp3
│       ├── bot-error.mp3
│       ├── bot-loss.mp3
│       ├── bot-pause.mp3
│       ├── bot-profit.mp3
│       ├── bot-resume.mp3
│       ├── bot-start.mp3
│       ├── bot-stop-emergency.mp3
│       ├── bot-stop.mp3
│       ├── error.mp3
│       ├── info.mp3
│       ├── sattle.mp3
│       ├── stop-loss.mp3
│       ├── success.mp3
│       ├── take-profit.mp3
│       ├── warn.mp3
│       └── zone.mp3
└── hooks/
    └── useSounds.ts
```

## Dependencies

The sound system requires the following dependency:

```json
{
  "use-sound": "^5.0.0"
}
```

This package is already installed in the project.

## Troubleshooting

### Common Issues

1. **Sounds Not Playing**
   - Check if the browser supports audio playback
   - Ensure user has interacted with the page (browser autoplay policy)
   - Verify sound files exist in the correct location

2. **Volume Issues**
   - Check system volume levels
   - Verify the volume option in the hook configuration
   - Test with different browsers

3. **Performance Issues**
   - Avoid creating multiple useSounds hook instances
   - Use the interrupt option for rapid sound sequences
   - Consider lazy loading for rarely used sounds

### Debug Tips

- Use browser developer tools to check network requests for audio files
- Test individual sound functions in isolation
- Check console for any error messages related to audio playback

## Future Enhancements

Potential improvements to consider:

1. **Sound Categories**: Group sounds by category for easier management
2. **User Preferences**: Allow users to customize volume and enable/disable sounds
3. **Sound Themes**: Support different sound packs or themes
4. **Background Music**: Add support for background music tracks
5. **Audio Visualization**: Add visual feedback for sound playback
