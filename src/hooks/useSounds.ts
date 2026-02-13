import useSound from 'use-sound';

// Import all sound files
import botDeadSound from '../assets/sounds/bot-dead.mp3';
import botErrorSound from '../assets/sounds/bot-error.mp3';
import botLossSound from '../assets/sounds/bot-loss.mp3';
import botPauseSound from '../assets/sounds/bot-pause.mp3';
import botProfitSound from '../assets/sounds/bot-profit.mp3';
import botResumeSound from '../assets/sounds/bot-resume.mp3';
import botStartSound from '../assets/sounds/bot-start.mp3';
import botStopEmergencySound from '../assets/sounds/bot-stop-emergency.mp3';
import botStopSound from '../assets/sounds/bot-stop.mp3';
import errorSound from '../assets/sounds/error.mp3';
import infoSound from '../assets/sounds/info.mp3';
import sattleSound from '../assets/sounds/sattle.mp3';
import stopLossSound from '../assets/sounds/stop-loss.mp3';
import successSound from '../assets/sounds/success.mp3';
import takeProfitSound from '../assets/sounds/take-profit.mp3';
import warnSound from '../assets/sounds/warn.mp3';
import zoneSound from '../assets/sounds/zone.mp3';

interface SoundOptions {
  volume?: number;
  playbackRate?: number;
  interrupt?: boolean;
}

export const useSounds = (defaultOptions: SoundOptions = {}) => {
  // Initialize all sounds with default options
  const [playBotDead] = useSound(botDeadSound, defaultOptions);
  const [playBotError] = useSound(botErrorSound, defaultOptions);
  const [playBotLoss] = useSound(botLossSound, defaultOptions);
  const [playBotPause] = useSound(botPauseSound, defaultOptions);
  const [playBotProfit] = useSound(botProfitSound, defaultOptions);
  const [playBotResume] = useSound(botResumeSound, defaultOptions);
  const [playBotStart] = useSound(botStartSound, defaultOptions);
  const [playBotStopEmergency] = useSound(botStopEmergencySound, defaultOptions);
  const [playBotStop] = useSound(botStopSound, defaultOptions);
  const [playError] = useSound(errorSound, defaultOptions);
  const [playInfo] = useSound(infoSound, defaultOptions);
  const [playSattle] = useSound(sattleSound, defaultOptions);
  const [playStopLoss] = useSound(stopLossSound, defaultOptions);
  const [playSuccess] = useSound(successSound, defaultOptions);
  const [playTakeProfit] = useSound(takeProfitSound, defaultOptions);
  const [playWarn] = useSound(warnSound, defaultOptions);
  const [playZone] = useSound(zoneSound, defaultOptions);

  return {
    playBotDead,
    playBotError,
    playBotLoss,
    playBotPause,
    playBotProfit,
    playBotResume,
    playBotStart,
    playBotStopEmergency,
    playBotStop,
    playError,
    playInfo,
    playSattle,
    playStopLoss,
    playSuccess,
    playTakeProfit,
    playWarn,
    playZone,
  };
};

export default useSounds;
