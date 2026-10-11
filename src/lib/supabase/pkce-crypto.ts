import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';
import { Platform } from 'react-native';

// Only the RNG and SHA-256 operations used by Supabase PKCE, not a full
// WebCrypto implementation. Account validation still uses server-side getUser.
export function installNativePkceCrypto() {
  if (Platform.OS === 'web') return;

  const nativeCrypto = globalThis.crypto;
  const target = nativeCrypto ?? {};
  if (typeof nativeCrypto?.getRandomValues !== 'function') {
    Object.defineProperty(target, 'getRandomValues', { value: getRandomValues });
  }
  if (typeof nativeCrypto?.subtle?.digest !== 'function') {
    const subtle = nativeCrypto?.subtle ?? {};
    Object.defineProperty(subtle, 'digest', {
      async value(algorithm: AlgorithmIdentifier, data: BufferSource) {
        const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
        if (name.toUpperCase() !== 'SHA-256') throw new Error('Unsupported PKCE digest');
        return digest(CryptoDigestAlgorithm.SHA256, data);
      },
    });
    if (!nativeCrypto?.subtle) Object.defineProperty(target, 'subtle', { value: subtle });
  }
  if (!nativeCrypto)
    Object.defineProperty(globalThis, 'crypto', { value: target, configurable: true });
}
