import { Platform } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
export async function shareExport(value: unknown) {
  const json = JSON.stringify(value, null, 2),
    name = `actaro-export-${Date.now()}.json`;
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Allow the browser to consume the URL before releasing the download buffer.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  if (!(await Sharing.isAvailableAsync()))
    throw new Error('File sharing is unavailable on this device. Export from web instead.');
  const file = new File(Paths.cache, name);
  try {
    file.create();
    // SDK 58: File.write is asynchronous; the share sheet must see the complete file.
    await file.write(json);
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      UTI: 'public.json',
      dialogTitle: 'Export Actaro data',
    });
  } finally {
    if (file.exists) file.delete();
  }
}
