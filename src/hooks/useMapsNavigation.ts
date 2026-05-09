import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import {
  openExternalNavigation,
  getPreferredIosMapsApp,
  isGoogleMapsAvailable,
  type NavigateTarget,
  type IosMapsApp,
} from '../utils/maps';

export function useMapsNavigation() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingTarget, setPendingTarget] = useState<NavigateTarget | null>(null);

  const navigate = useCallback(async (target: NavigateTarget) => {
    if (!target.coordinates && !target.address) {
      console.warn('useMapsNavigation: navigate called without coordinates or address');
      return;
    }

    if (Platform.OS !== 'ios') {
      await openExternalNavigation(target);
      return;
    }

    const stored = await getPreferredIosMapsApp();
    if (stored) {
      await openExternalNavigation(target, stored);
      return;
    }

    const hasGoogle = await isGoogleMapsAvailable();
    if (!hasGoogle) {
      // Only Apple Maps available — no need to ask
      await openExternalNavigation(target, 'apple');
      return;
    }

    setPendingTarget(target);
    setPickerOpen(true);
  }, []);

  const onPickerSelect = useCallback(
    async (app: IosMapsApp) => {
      setPickerOpen(false);
      const target = pendingTarget;
      setPendingTarget(null);
      if (target) {
        await openExternalNavigation(target, app);
      }
    },
    [pendingTarget]
  );

  const closePicker = useCallback(() => {
    setPickerOpen(false);
    setPendingTarget(null);
  }, []);

  return { navigate, pickerOpen, onPickerSelect, closePicker };
}
