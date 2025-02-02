import React, { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LanguageSelectionScreen from './screens/LanguageSelectionScreen';
import ChatScreen from './screens/ChatScreen';

// 스플래시 화면 자동 숨김 방지
SplashScreen.preventAutoHideAsync();

const Stack = createStackNavigator();

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<'LanguageSelection' | 'Chat'>('LanguageSelection');

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // 스플래시 화면 유지 시간
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // AsyncStorage에서 언어 선택 여부 확인
        const hasSelectedLanguage = await AsyncStorage.getItem('hasSelectedLanguage');
        if (hasSelectedLanguage) {
          setInitialRoute('Chat'); // 언어를 이미 선택한 경우 채팅 화면으로 설정
        }
      } catch (e) {
        console.error('Error during app initialization:', e);
      } finally {
        setIsAppReady(true);
        await SplashScreen.hideAsync();
      }
    };

    prepareApp();
  }, []);

  if (!isAppReady) {
    return null; // 앱 준비 중에는 아무것도 렌더링하지 않음
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="LanguageSelection"
          component={LanguageSelectionScreen}
          options={{ title: '언어 선택' }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={{ title: '채팅 화면' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}