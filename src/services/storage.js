import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@asl_translation_history';
const MAX_HISTORY_ITEMS = 20;

export async function getTranslationHistory() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.warn('Unable to load translation history', error);
    return [];
  }
}

export async function addTranslationHistory(entry) {
  try {
    const current = await getTranslationHistory();
    const nextHistory = [entry, ...current].slice(0, MAX_HISTORY_ITEMS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory));
    return nextHistory;
  } catch (error) {
    console.warn('Unable to save translation history', error);
    return [];
  }
}

export async function clearTranslationHistory() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to clear translation history', error);
  }
}
