import { Platform, Vibration } from 'react-native';

export function hapticSelection(): void {
  if (Platform.OS === 'web') return;
  try {
    Vibration.vibrate(8);
  } catch {
    // ignore on unsupported hardware
  }
}

export function hapticImpact(): void {
  if (Platform.OS === 'web') return;
  try {
    Vibration.vibrate(14);
  } catch {
    // ignore on unsupported hardware
  }
}
