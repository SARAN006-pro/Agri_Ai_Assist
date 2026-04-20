import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { useRef, useCallback, useEffect, useState } from 'react';
import { useVoiceInput, useTextToSpeech, getVoiceCode } from '../hooks/useVoiceInput';
import { translateText, detectLanguage } from '../services/api';

/**
 * SpeechPipeline - Full voice translation workflow
 *
 * Pipeline:
 *   1. User speaks in their language (speech → text via Web Speech API)
 *   2. System translates to English (for AI understanding)
 *   3. AI generates response in English
 *   4. Response is translated back to user's language
 *   5. Text is spoken aloud (TTS) in user's language
 *
 * Props:
 *   language: current UI language code (e.g. 'hi', 'ta')
 *   onInterimResult: callback for interim transcription results
 *   disabled: disable voice controls
 */
export function SpeechPipeline({
  language = 'en',
  onInterimResult,
  onFinalResult,
  disabled = false,
  inputLanguage = null, // override for input lang detection
  children,
}) {
  const [translatedText, setTranslatedText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const debounceRef = useRef(null);

  const voiceCode = getVoiceCode(language);
  const inputLang = inputLanguage || language;

  // Speech recognition
  const { isListening, isSupported, startListening, stopListening, toggleListening, updateLanguage } = useVoiceInput({
    language: getVoiceCode(inputLang),
    continuous: false,
    onResult: (text, isFinal) => {
      if (isFinal) {
        handleFinalSpeech(text);
      } else if (onInterimResult) {
        onInterimResult(text);
      }
    },
    onError: (err) => {
      console.warn('Speech recognition error:', err);
    },
  });

  // Text-to-speech
  const { speak, stop, isSpeaking } = useTextToSpeech();

  // Update recognition language when inputLanguage changes
  useEffect(() => {
    updateLanguage(getVoiceCode(inputLang));
  }, [inputLang, updateLanguage]);

  // Translate user speech to English for AI processing
  const handleFinalSpeech = useCallback(async (spokenText) => {
    setIsProcessing(true);

    try {
      // Detect language of spoken text
      let sourceLang = inputLang;
      try {
        const detected = await detectLanguage({ text: spokenText });
        sourceLang = detected.data.detected_lang || inputLang;
      } catch {
        // fallback to input lang
      }

      // Translate to English
      let textToSend = spokenText;
      if (sourceLang !== 'en') {
        const transResult = await translateText({
          text: spokenText,
          source_lang: sourceLang,
          target_lang: 'en',
        });
        textToSend = transResult.data.translated_text || spokenText;
      }
      setTranslatedText(textToSend);

      if (onFinalResult) {
        onFinalResult(textToSend, sourceLang);
      }
    } catch (err) {
      console.error('Translation pipeline error:', err);
      if (onFinalResult) {
        onFinalResult(spokenText, inputLang);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [inputLang, onFinalResult]);

  // Speak AI reply in user's language
  const speakReply = useCallback((reply, targetLang = null) => {
    const lang = targetLang || language;
    if (lang === 'en') {
      speak(reply, getVoiceCode('en'));
      return;
    }

    // Translate reply to user's language first
    translateText({
      text: reply,
      source_lang: 'en',
      target_lang: lang,
    })
      .then((res) => {
        const translated = res.data.translated_text;
        setReplyText(translated);
        speak(translated, getVoiceCode(lang));
      })
      .catch(() => {
        // Fallback: speak original English
        speak(reply, getVoiceCode('en'));
      });
  }, [language, speak]);

  // Stop all when language changes
  useEffect(() => {
    stop();
    stopListening();
  }, [language, stop, stopListening]);

  const toggleVoice = useCallback(() => {
    if (disabled) return;
    if (isSpeaking) {
      stop();
    } else {
      toggleListening();
    }
  }, [disabled, isSpeaking, toggleListening, stop]);

  if (!isSupported) {
    return children ? children({ toggleVoice, isListening, isSpeaking, isProcessing, speakReply }) : null;
  }

  return children ? children({
    toggleVoice,
    isListening,
    isSpeaking,
    isProcessing,
    speakReply,
    stopSpeaking: stop,
    stopListening,
  }) : null;
}

/**
 * VoiceInputButton - Microphone button for Chat input
 * Shows listening state with pulsing animation
 */
export function VoiceInputButton({ isListening, isProcessing, disabled, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex items-center justify-center rounded-full transition-all duration-200
        ${isListening
          ? 'bg-red-500 hover:bg-red-600 animate-pulse-ring text-white'
          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        w-10 h-10 ${className}
      `}
      title={isListening ? 'Stop listening' : 'Voice input'}
    >
      {isListening ? (
        <MicOff size={18} strokeWidth={2} />
      ) : (
        <Mic size={18} strokeWidth={2} />
      )}
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-20" />
      )}
    </button>
  );
}

/**
 * VoiceOutputButton - Speaker button to read AI reply aloud
 */
export function VoiceOutputButton({ isSpeaking, disabled, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        flex items-center justify-center rounded-full transition-all duration-200
        ${isSpeaking
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400'
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        w-8 h-8 ${className}
      `}
      title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
    >
      {isSpeaking ? <VolumeX size={15} strokeWidth={2} /> : <Volume2 size={15} strokeWidth={2} />}
    </button>
  );
}
