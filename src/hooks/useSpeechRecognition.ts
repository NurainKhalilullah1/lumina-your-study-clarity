import { useState, useEffect, useCallback } from 'react';

// Define Speech Recognition types to avoid IDE errors without needing external @types packages
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export const useSpeechRecognition = (onResult: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Type casting for browser-specific implementations
    const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognitionConstructor) {
      setSupported(false);
      return;
    }

    const recognitionInstance = new SpeechRecognitionConstructor();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      // Convert results to an array and slice from the current index to avoid dynamic bracket indexing
      const newResults = Array.from(event.results as any).slice(event.resultIndex);
      
      for (const result of newResults) {
        const anyResult = result as any;
        if (anyResult.isFinal) {
          finalTranscript += anyResult[0].transcript;
        } else {
          interimTranscript += anyResult[0].transcript;
        }
      }
      
      // If there's a final transcript, we pass it. Otherwise, interim.
      onResult(finalTranscript || interimTranscript);
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognitionInstance.onend = () => {
      // Auto-restart if we are still supposed to be listening?
      // For now, let's just set listening to false.
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognition && !isListening) {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error("Error starting speech recognition:", e);
      }
    }
  }, [recognition, isListening]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  }, [recognition, isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    startListening,
    stopListening,
    toggleListening,
    supported
  };
};
