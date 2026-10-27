import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthLink, AuthText } from '@/features/auth/auth-components';
import { useAppTheme } from '@/features/profile/theme-context';
import type { RunPoint } from './run-model';
import { RunRoute } from './run-route';
import { MapSurface } from './run-map-surface';
import { runMapDocument, runMapPayload } from './run-map-document';

export function RunMap({
  points,
  live = false,
  height = 320,
  fullScreen = false,
}: {
  points: readonly RunPoint[];
  live?: boolean;
  height?: number;
  /** Fill the parent edge to edge; the map shows its own attribution. */
  fullScreen?: boolean;
}) {
  const { colors, scheme } = useAppTheme(),
    insets = useSafeAreaInsets();
  // Full screen, controls clear the status bar and the 64 pt row of floating run controls.
  const controlsTop = fullScreen ? insets.top + 64 : 12;
  const payload = useMemo(() => runMapPayload(points, live), [points, live]);
  const [initial] = useState(payload);
  const html = useMemo(
    () => runMapDocument(initial, colors.accent, scheme === 'dark', controlsTop),
    [initial, colors.accent, scheme, controlsTop],
  );
  const [attempt, setAttempt] = useState(0),
    [status, setStatus] = useState('loading'),
    [stage, setStage] = useState('start'),
    [reason, setReason] = useState<string | null>(null);
  const receive = useCallback((value: string) => {
    if (value === 'actaro-map:ready') setStatus('ready');
    else if (value.startsWith('actaro-map:stage:')) setStage(value.slice(17, 40));
    else if (value.startsWith('actaro-map:error')) {
      setReason(value.slice(17, 177) || null);
      setStatus('error');
    }
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
      <View
        style={
          fullScreen
            ? { flex: 1, gap: 8, padding: 16, paddingTop: 120, backgroundColor: colors.background }
            : { gap: 8 }
        }
      >
        <RunRoute points={points} />
        <AuthText>
          Street map unavailable. GPS recording still works; showing your route outline.
        </AuthText>
        <AuthText kind="muted">
          Map stopped at: {stage}
          {reason ? ` · ${reason}` : ' · timed out'}
        </AuthText>
        <AuthLink
          title="Retry street map"
          onPress={() => {
            setStatus('loading');
            setStage('start');
            setReason(null);
            setAttempt((value) => value + 1);
          }}
        />
      </View>
    );
  if (fullScreen)
    return (
      <View style={{ flex: 1, backgroundColor: colors.fill }}>
        <MapSurface key={attempt} html={html} payload={payload} onStatus={receive} />
      </View>
    );
  return (
    <View style={{ gap: 6 }}>
      <View style={{ height, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.fill }}>
        <MapSurface key={attempt} html={html} payload={payload} onStatus={receive} />
      </View>
      {status === 'loading' && (
        <AuthText kind="muted">Loading street map… Recording continues while it loads.</AuthText>
      )}
    </View>
  );
}
