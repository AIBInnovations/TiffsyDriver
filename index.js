/**
 * @format
 */

import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';

// Register background handler for FCM
// This must be registered outside of the app lifecycle (before AppRegistry.registerComponent)
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('🔔 Background notification received:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
