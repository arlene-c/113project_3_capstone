import React, { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import colors from '../theme/colors';
import { getTranslationHistory, clearTranslationHistory } from '../services/storage';

export default function HomeScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const items = await getTranslationHistory();
    setHistory(items);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  function handleClearHistory() {
    Alert.alert(
      'Clear history',
      'Remove all saved translation entries? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearTranslationHistory();
            loadHistory();
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ASL Finger Spelling Translator</Text>
      <Text style={styles.subtitle}>
        Use the camera to capture fingerspelling and see the English letter translation.
      </Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => navigation.navigate('Translate')}
      >
        <Text style={styles.primaryButtonText}>Start ASL → English</Text>
      </TouchableOpacity>

      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Recent translations</Text>
        {history.length > 0 ? (
          <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" />
      ) : history.length === 0 ? (
        <Text style={styles.emptyText}>No translations yet. Start by taking a picture.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          style={styles.historyList}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <Text style={styles.historyLetter}>{item.translation}</Text>
              <View style={styles.historyText}>
                <Text style={styles.historyDescription}>{item.type}</Text>
                <Text style={styles.historyTimestamp}>{item.timestamp}</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSoft,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  primaryButtonText: {
    color: colors.buttonText,
    fontSize: 16,
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textDark,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    color: colors.error,
    fontWeight: '600',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLetter: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textDark,
    width: 48,
    textAlign: 'center',
  },
  historyText: {
    marginLeft: 16,
    flex: 1,
  },
  historyDescription: {
    fontSize: 15,
    color: colors.textSoft,
  },
  historyTimestamp: {
    color: colors.textSoft,
    marginTop: 6,
    fontSize: 12,
  },
  emptyText: {
    color: colors.textSoft,
    fontSize: 15,
  },
});
