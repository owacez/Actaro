import { useEffect, useRef } from 'react';
import type { RunMapPayload } from './run-map-document';

export function MapSurface({
  html,
  payload,
  onStatus,
}: {
  html: string;
  payload: RunMapPayload;
  onStatus: (status: string) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.source === frame.current?.contentWindow && typeof event.data === 'string')
        onStatus(event.data);
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onStatus]);
  useEffect(() => {
    frame.current?.contentWindow?.postMessage({ channel: 'actaro-run-map', payload }, '*');
  }, [payload]);
  return (
    <iframe
      ref={frame}
      title="Live running street map"
      srcDoc={html}
      sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
      referrerPolicy="no-referrer"
      style={{ width: '100%', height: '100%', border: 0 }}
      onLoad={() =>
        frame.current?.contentWindow?.postMessage({ channel: 'actaro-run-map', payload }, '*')
      }
    />
  );
}
