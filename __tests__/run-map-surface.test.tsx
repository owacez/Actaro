import { expect, jest, test } from '@jest/globals';
import { render } from '@testing-library/react-native';
import { MapSurface, mapPageOrigin } from '@/features/running/run-map-surface';
import { runMapPayload } from '@/features/running/run-map-document';
import { runFixture } from './helpers/run-fixture';
type Props = {
  source: { html: string; baseUrl: string };
  onShouldStartLoadWithRequest: (request: { url: string; navigationType?: string }) => boolean;
};
jest.mock('@/lib/supabase/client', () => ({ getSupabase: jest.fn() }));
let mockProps: Props | null = null;
jest.mock('react-native-webview', () => {
  const { forwardRef } = jest.requireActual<typeof import('react')>('react');
  return {
    WebView: forwardRef(function WebView(props: Props, _ref) {
      mockProps = props;
      return null;
    }),
  };
});
test('map page has a secure origin and cannot navigate away from its own document', async () => {
  await render(
    <MapSurface
      html="<p>map</p>"
      payload={runMapPayload(runFixture().route, true)}
      onStatus={jest.fn()}
    />,
  );
  if (!mockProps) throw new Error('WebView not rendered');
  expect(mockProps.source).toEqual({ html: '<p>map</p>', baseUrl: mapPageOrigin });
  expect(mapPageOrigin).toMatch(/^https:\/\/[a-z-]+\.localhost\/$/);
  const navigate = mockProps.onShouldStartLoadWithRequest;
  expect(navigate({ url: mapPageOrigin })).toBe(true);
  expect(navigate({ url: 'about:blank' })).toBe(true);
  expect(navigate({ url: 'https://example.com/' })).toBe(false);
  expect(navigate({ url: 'actaro://runs' })).toBe(false);
});
