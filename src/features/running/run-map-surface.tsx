import { useEffect, useMemo, useRef } from 'react';
import { Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { mapJson, type RunMapPayload } from './run-map-document';

export type MapSurfaceProps = {
  html: string;
  payload: RunMapPayload;
  onStatus: (status: string) => void;
};
export function MapSurface({ html, payload, onStatus }: MapSurfaceProps) {
  const view = useRef<WebView>(null);
  const source = useMemo(() => ({ html }), [html]);
  const script = `window.updateActaroMap?.(${mapJson(payload)});true;`;
  useEffect(() => {
    view.current?.injectJavaScript(script);
  }, [script]);
  return (
    <WebView
      ref={view}
      source={source}
      originWhitelist={['*']}
      accessibilityLabel="Live running street map"
      style={{ flex: 1 }}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      sharedCookiesEnabled={false}
      thirdPartyCookiesEnabled={false}
      allowsInlineMediaPlayback={false}
      setSupportMultipleWindows={false}
      onLoadEnd={() => view.current?.injectJavaScript(script)}
      onMessage={(event) => onStatus(event.nativeEvent.data)}
      onError={() => onStatus('actaro-map:error')}
      onContentProcessDidTerminate={() => onStatus('actaro-map:error')}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === 'about:blank') return true;
        try {
          const url = new URL(request.url);
          if (
            request.navigationType === 'click' &&
            url.protocol === 'https:' &&
            [
              'openfreemap.org',
              'openmaptiles.org',
              'www.openmaptiles.org',
              'www.openstreetmap.org',
            ].includes(url.hostname)
          )
            void Linking.openURL(request.url).catch(() => {});
        } catch {
          /* A map cannot navigate into application routes. */
        }
        return false;
      }}
    />
  );
}
