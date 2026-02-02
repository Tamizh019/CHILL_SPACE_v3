import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GlobalStoreProvider, useGlobalStore } from '@/context/GlobalStoreContext';
import AuthScreen from '@/screens/AuthScreen';
import HomeScreen from '@/screens/HomeScreen';
import ChatScreen from '@/screens/ChatScreen';
import { View, ActivityIndicator } from 'react-native';
import "./global.css"
import 'react-native-url-polyfill/auto';

// Define navigation types
export type RootStackParamList = {
  Auth: undefined;
  Home: undefined;
  Chat: { channelId?: string; userId?: string; name: string; type?: 'dm' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppContent() {
  const { user, isLoading } = useGlobalStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({ title: route.params.name })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GlobalStoreProvider>
      <AppContent />
    </GlobalStoreProvider>
  );
}
