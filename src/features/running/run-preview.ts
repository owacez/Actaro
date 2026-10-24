import * as Location from 'expo-location';
import type { RunPoint } from './run-model';

export type RunPreview =
  | { state: 'off' }
  | { state: 'searching'; point: RunPoint | null }
  | { state: 'ready'; point: RunPoint };

// Where the start screen centres its map. It never asks for permission: without an existing
// foreground grant it reports 'off', and the run's own start flow explains and requests it.
export async function runPreview(onUpdate: (preview: RunPreview) => void) {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    onUpdate({ state: 'off' });
    return;
  }
  const point = (location: Location.LocationObject): RunPoint => ({
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy ?? 9999,
    timestamp: location.timestamp,
    segment: 0,
  });
  const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 }).catch(
    () => null,
  );
  onUpdate({ state: 'searching', point: last ? point(last) : null });
  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  }).catch(() => null);
  if (current) onUpdate({ state: 'ready', point: point(current) });
}
