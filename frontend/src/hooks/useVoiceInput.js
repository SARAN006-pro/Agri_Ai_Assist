import { useCallback, useRef, useState } from 'react';

/**
 * useVoiceInput - Web Speech API hook for speech recognition
 * Converts spoken words to text in the user's selected language.
 * Falls back gracefully when not supported.
 */
export function useVoiceInput({ language = 'en-US', onResult, onError, continuous = false }) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  // Detect support once
  if (typeof window !== 'undefined') {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        let finalText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          }
        }
        if (finalText && onResult) {
          onResult(finalText, false);
        } else if (onResult) {
          // interim result
          onResult(event.results[event.results.length - 1][0].transcript, true);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'no-speech' && onError) {
          onError(event.error);
        }
      };

      recognitionRef.current = recognition;
    }
  }

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already started
    }
  }, [language, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;
    try {
      recognitionRef.current.stop();
      setIsListening(false);
    } catch (e) {
      // Already stopped
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Update language when it changes
  const updateLanguage = useCallback((lang) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
    }
  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    updateLanguage,
  };
}

/**
 * useTextToSpeech - Web Speech API hook for speech synthesis
 * Speaks text aloud in the user's selected language.
 */
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const speak = useCallback((text, lang = 'en-US', rate = 0.95, pitch = 1.0) => {
    if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Try to find a voice that matches the language
    const voices = window.speechSynthesis.getVoices();
    const matchVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]));
    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, stop, isSpeaking };
}

/**
 * Language code to BCP-47 voice code mapping
 */
export const VOICE_CODES = {
  en: 'en-US',
  hi: 'hi-IN',
  bn: 'bn-BD',
  ta: 'ta-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  ml: 'ml-IN',
  es: 'es-ES',
  pt: 'pt-BR',
  id: 'id-ID',
};

export const getVoiceCode = (lang) => VOICE_CODES[lang] || 'en-US';
