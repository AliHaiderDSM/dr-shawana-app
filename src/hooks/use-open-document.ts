import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert } from 'react-native';
import { errorMessage, errorStatus } from '@/lib/errors';
import { colors } from '@/theme/tokens';
import { type DocumentFile, useLazyGetDocumentUrlQuery } from '@/redux/features/documents';

export function useOpenDocument() {
  const [getUrl] = useLazyGetDocumentUrlQuery();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const open = async (file: DocumentFile) => {
    if (openingId) return;
    setOpeningId(file.id);
    try {
      const { url } = await getUrl(file.id).unwrap();
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: colors.surface,
        controlsColor: colors.primary,
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (error) {
      Alert.alert(
        'Could not open the file',
        errorStatus(error) === 404
          ? 'This file is no longer available. Please contact the clinic.'
          : errorMessage(error),
      );
    } finally {
      setOpeningId(null);
    }
  };

  return { open, openingId };
}
