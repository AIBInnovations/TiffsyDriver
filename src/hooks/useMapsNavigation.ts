import { useCallback } from 'react';
import { openExternalNavigation, type NavigateTarget } from '../utils/maps';

// Thin wrapper kept for screen-level call-site stability. We used to host an
// iOS Google-vs-Apple-Maps picker here; that's gone — drivers always use
// Google Maps now — so the hook is just a passthrough. Kept (not deleted)
// to avoid churning every screen's imports.
export function useMapsNavigation() {
  const navigate = useCallback(async (target: NavigateTarget) => {
    if (!target.coordinates && !target.address) {
      console.warn('useMapsNavigation: navigate called without coordinates or address');
      return;
    }
    await openExternalNavigation(target);
  }, []);

  return { navigate };
}
