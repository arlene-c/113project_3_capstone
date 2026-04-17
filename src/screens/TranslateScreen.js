import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Video } from 'expo-av';
import { useIsFocused } from '@react-navigation/native';
import colors from '../theme/colors';
import { detectFingerspellingFromMedia } from '../services/translation';
import { addTranslationHistory } from '../services/storage';

export default function TranslateScreen() {
  const cameraRef = useRef(null);
  const isFocused = useIsFocused();
  const [permission, setPermission] = useState(null);
  const [mode, setMode] = useState('photo');
  const [photoUri, setPhotoUri] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [recording, setRecording] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setPermission(status === 'granted');
      } catch (cameraError) {
        setError('Failed to request camera permission.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!isFocused) {
      setPhotoUri(null);
      setVideoUri(null);
      setTranslation(null);
      setProcessing(false);
      setError(null);
    }
  }, [isFocused]);

  const handleAnalyze = async (uri, mediaType) => {
    setProcessing(true);
    setError(null);
    try {
      const result = detectFingerspellingFromMedia(uri);
      const entry = {
        id: `${Date.now()}-${mediaType}`,
        translation: result.letter,
        type: mediaType === 'video' ? 'Video capture' : 'Photo capture',
        timestamp: new Date().toLocaleString(),
      };
      await addTranslationHistory(entry);
      setTranslation(result);
    } catch (analysisError) {
      setError('Unable to analyze the captured media.');
    } finally {
      setProcessing(false);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current) {
      setError('Camera is not ready yet.');
      return;
    }
    try {
      setProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      setPhotoUri(photo.uri);
      setVideoUri(null);
      await handleAnalyze(photo.uri, 'photo');
    } catch (captureError) {
      setError('Failed to capture photo. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleRecording = async () => {
    if (!cameraRef.current) {
      setError('Camera is not ready yet.');
      return;
    }

    if (recording) {
      try {
        const data = await cameraRef.current.stopRecording();
        setVideoUri(data.uri);
        setPhotoUri(null);
        await handleAnalyze(data.uri, 'video');
      } catch (stopError) {
        setError('Unable to stop recording correctly.');
      } finally {
        setRecording(false);
      }
      return;
    }

    try {
      setProcessing(true);
      setRecording(true);
      setError(null);
      await cameraRef.current.recordAsync({ maxDuration: 8, quality: Camera.Constants.VideoQuality['480p'] });
    } catch (recordError) {
      setRecording(false);
      setError('Failed to start recording. Please try again.');
      setProcessing(false);
    }
  };

  if (permission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.statusText}>Requesting camera access...</Text>
      </View>
    );
  }

  if (permission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Camera access denied.</Text>
        <Text style={styles.errorText}>
          Please enable camera permission in your device settings to use the translation features.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.modeSwitcher}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
          onPress={() => setMode('photo')}
        >
          <Text style={[styles.modeButtonText, mode === 'photo' && styles.modeButtonTextActive]}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'video' && styles.modeButtonActive]}
          onPress={() => setMode('video')}
        >
          <Text style={[styles.modeButtonText, mode === 'video' && styles.modeButtonTextActive]}>Video</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraWrapper}>
        {isFocused ? (
          <Camera ref={cameraRef} style={styles.camera} ratio="16:9" />
        ) : (
          <View style={styles.cameraDisabled}>
            <Text style={styles.cameraDisabledText}>Camera preview is unavailable while screen is not focused.</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        {mode === 'photo' ? (
          <TouchableOpacity style={styles.captureButton} onPress={takePhoto} disabled={processing}>
            <Text style={styles.captureButtonText}>Take Photo</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.captureButton} onPress={toggleRecording} disabled={processing && !recording}>
            <Text style={styles.captureButtonText}>{recording ? 'Stop Recording' : 'Record Video'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.resultPanel}>
        <Text style={styles.sectionTitle}>Detected Letter</Text>
        {processing ? (
          <View style={styles.processingRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.processingText}>Analyzing capture...</Text>
          </View>
        ) : translation ? (
          <View style={styles.translationCard}>
            <Text style={styles.translationLetter}>{translation.letter}</Text>
            <Text style={styles.translationNote}>{translation.note}</Text>
          </View>
        ) : (
          <Text style={styles.descriptionText}>Capture a photo or video to see the translated letter.</Text>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>

      {(photoUri || videoUri) && (
        <View style={styles.previewWrapper}>
          <Text style={styles.previewLabel}>Last capture preview</Text>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          ) : (
            <Video
              source={{ uri: videoUri }}
              style={styles.previewImage}
              useNativeControls
              resizeMode="contain"
              isLooping
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statusText: {
    marginTop: 12,
    color: colors.textSoft,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
    marginBottom: 10,
  },
  errorText: {
    color: colors.textSoft,
    fontSize: 16,
    lineHeight: 22,
  },
  modeSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.accent,
  },
  modeButtonText: {
    color: colors.textSoft,
    fontSize: 16,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: colors.buttonText,
  },
  cameraWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000000',
    aspectRatio: 16 / 9,
    marginBottom: 18,
  },
  camera: {
    flex: 1,
  },
  cameraDisabled: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
  },
  cameraDisabledText: {
    color: colors.buttonText,
    textAlign: 'center',
  },
  controls: {
    alignItems: 'center',
    marginBottom: 16,
  },
  captureButton: {
    backgroundColor: colors.textDark,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  captureButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '700',
  },
  resultPanel: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 10,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  processingText: {
    marginLeft: 10,
    color: colors.textSoft,
    fontSize: 15,
  },
  translationCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
  },
  translationLetter: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 10,
  },
  translationNote: {
    color: colors.textSoft,
    fontSize: 14,
    textAlign: 'center',
  },
  descriptionText: {
    color: colors.textSoft,
    fontSize: 15,
  },
  previewWrapper: {
    marginTop: 10,
  },
  previewLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 8,
  },
  previewImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#EEE',
  },
});
