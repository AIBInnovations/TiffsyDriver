import { useState, useCallback } from 'react';
import type { AlertButton } from '../components/common/CustomAlert';

interface AlertConfig {
  visible: boolean;
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  icon?: string;
  iconColor?: string;
}

export interface ShowAlertOptions {
  title?: string;
  message?: string;
  buttons?: AlertButton[];
  icon?: string;
  iconColor?: string;
}

/**
 * Drop-in replacement for React Native's `Alert.alert` using the in-app
 * `CustomAlert` component for consistent UI styling.
 *
 * Usage:
 *   const { alertProps, showAlert } = useAlert();
 *   showAlert({ title: 'Error', message: '...' });
 *   <CustomAlert {...alertProps} />
 */
export function useAlert() {
  const [config, setConfig] = useState<AlertConfig>({ visible: false });

  const showAlert = useCallback((opts: ShowAlertOptions) => {
    setConfig({ ...opts, visible: true });
  }, []);

  const hideAlert = useCallback(() => {
    setConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    showAlert,
    hideAlert,
    alertProps: { ...config, onClose: hideAlert },
  };
}
