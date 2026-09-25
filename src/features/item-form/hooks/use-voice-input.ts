// Mikrofon düğmesi: Android'in konuşma tanıma servisiyle Türkçe dinler.
// Ses cihazda / Google tanıma servisinde işlenir, uygulama sesi saklamaz;
// yalnızca çıkan metin forma yazılır. İzin ilk dokunuşta istenir.
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { showToast } from '@/shared/components/toast/toast-store';

import { parseSpokenItem, type SpokenItem } from '../lib/parse-spoken-item';

export function useVoiceInput(onResult: (item: SpokenItem) => void) {
  const { t } = useTranslation();
  const [listening, setListening] = useState(false);
  const listeningRef = useRef(false);
  useEffect(() => {
    listeningRef.current = listening;
  }, [listening]);

  // Sayfa kapanırken dinleme sürüyorsa kesilir.
  useEffect(
    () => () => {
      if (listeningRef.current) {
        ExpoSpeechRecognitionModule.abort();
      }
    },
    [],
  );

  useSpeechRecognitionEvent('start', () => setListening(true));
  useSpeechRecognitionEvent('end', () => setListening(false));
  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results[0]?.transcript ?? '';
    if (event.isFinal && transcript.trim().length > 0) {
      onResult(parseSpokenItem(transcript));
    }
  });
  useSpeechRecognitionEvent('error', (event) => {
    setListening(false);
    if (event.error === 'aborted') {
      return;
    }
    if (event.error === 'no-speech' || event.error === 'speech-timeout') {
      showToast(t('itemForm.voiceNoMatch'), { kind: 'error' });
      return;
    }
    showToast(t('itemForm.voiceUnavailable'), { kind: 'error' });
  });

  const toggle = async () => {
    if (listening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    if (!ExpoSpeechRecognitionModule.isRecognitionAvailable()) {
      showToast(t('itemForm.voiceUnavailable'), { kind: 'error' });
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      showToast(t('itemForm.voicePermissionDenied'), { kind: 'error' });
      return;
    }
    void Haptics.selectionAsync();
    ExpoSpeechRecognitionModule.start({
      lang: 'tr-TR',
      interimResults: false,
      maxAlternatives: 1,
      continuous: false,
    });
  };

  return { listening, toggle };
}
