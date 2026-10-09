import { afterEach, describe, expect, jest, test } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';
import { renderToString } from 'react-dom/server';
import * as ReactNative from 'react-native';

import { useColorScheme } from '../src/hooks/use-color-scheme.web';

describe('web color scheme hydration', () => {
  test('uses a stable light server snapshot even when the device uses dark mode', () => {
    jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');

    function ServerProbe() {
      return useColorScheme();
    }

    expect(renderToString(<ServerProbe />)).toBe('light');
  });

  test('uses the device preference on the client and follows subsequent changes', async () => {
    const preference = jest.spyOn(ReactNative, 'useColorScheme').mockReturnValue('dark');
    const { result, rerender } = await renderHook(() => useColorScheme());

    expect(result.current).toBe('dark');

    preference.mockReturnValue('light');
    await rerender({});
    expect(result.current).toBe('light');

    preference.mockReturnValue('unspecified');
    await rerender({});
    expect(result.current).toBe('unspecified');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
