import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import TranslateScreen from '../screens/TranslateScreen';
import colors from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.pastelGreen,
        },
        headerTintColor: colors.textDark,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'ASL Translator' }}
      />
      <Stack.Screen
        name="Translate"
        component={TranslateScreen}
        options={{ title: 'ASL → English' }}
      />
    </Stack.Navigator>
  );
}
