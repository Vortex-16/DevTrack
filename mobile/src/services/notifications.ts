import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async (): Promise<{ token: string | null; error?: string }> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  if (!Device.isDevice) {
    return { token: null, error: 'Must use a physical device' };
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return { token: null, error: 'Permission not granted' };
  }

  // Get the token
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                    Constants?.easConfig?.projectId ?? 
                    'a5679b36-c786-44e3-a7ef-a5e9297f3eb8'; // Updated to match app.json
  
  if (!projectId) {
    return { token: null, error: 'Missing Project ID' };
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return { token };
  } catch (e: any) {
    return { token: null, error: e.message || 'Failed to get push token' };
  }
};

// Function to send a local notification (useful for testing)
export const sendLocalNotification = async (title: string, body: string) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { data: 'goes here' },
    },
    trigger: null, // Send immediately
  });
};
