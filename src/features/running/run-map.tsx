import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AuthLink, AuthText } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import type { RunPoint } from './run-model';
import { RunRoute } from './run-route';
import { MapSurface } from './run-map-surface';
import { runMapDocument, runMapPayload } from './run-map-document';

export function RunMap({ points, live = false }: { points: readonly RunPoint[]; live?: boolean }) {
  const { colors, scheme } = useAppTheme();
  const payload = useMemo(() => runMapPayload(points, live), [points, live]);
  const [initial] = useState(payload);
  const html = useMemo(
    () => runMapDocument(initial, colors.accent, scheme === 'dark'),
    [initial, colors.accent, scheme],
  );
  const [attempt, setAttempt] = useState(0),
    [status, setStatus] = useState('loading');
  const receive = useCallback((value: string) => {
    if (value === 'actaro-map:ready') setStatus('ready');
    else if (value === 'actaro-map:error') setStatus('error');
  }, []);
  useEffect(() => {
    const timer = setTimeout(
      () => setStatus((value) => (value === 'ready' ? value : 'error')),
      20000,
    );
    return () => clearTimeout(timer);
  }, [attempt, html]);
  if (status === 'error')
    return (
      <View style={{ gap: 8 }}>
        <RunRoute points={points} />
        <AuthText>
          Street map unavailable. GPS recording still works; showing your route outline.
        </AuthText>
        <AuthLink
          title="Retry street map"
          onPress={() => {
            setStatus('loading');
            setAttempt((value) => value + 1);
          }}
        />
      </View>
    );
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ height: 320, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.fill }}
      >
        <MapSurface key={attempt} html={html} payload={payload} onStatus={receive} />
      </View>
      {status === 'loading' && (
        <AuthText kind="muted">Loading street map… Recording continues while it loads.</AuthText>
      )}
      <AuthText kind="muted">OpenFreeMap · © OpenMapTiles · © OpenStreetMap contributors</AuthText>
    </View>
  );
}
