import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useCanvasRef } from '@shopify/react-native-skia';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { PhotoCanvas } from './src/canvas/PhotoCanvas';
import { buildRenderPackage } from './src/ai/renderPackageBuilder';
import type { RenderPackageResult } from './src/ai/renderPackageBuilder';
import { BottomPanel } from './src/components/BottomPanel';
import { DebugSharePanel } from './src/components/DebugSharePanel';
import type { DebugArtifact } from './src/components/DebugSharePanel';
import { PrimaryButton } from './src/components/PrimaryButton';
import { exportAndShareCanvas } from './src/export/exportCanvas';
import { useEditorStore } from './src/store/editorStore';
import type { FinishId } from './src/types/editor';

export default function App() {
  const canvasRef = useCanvasRef();
  const photo = useEditorStore((state) => state.photo);
  const overlayVisible = useEditorStore((state) => state.overlayVisible);
  const corners = useEditorStore((state) => state.corners);
  const canvasSize = useEditorStore((state) => state.canvasSize);
  const selectedFinish = useEditorStore((state) => state.selectedFinish);
  const setPhoto = useEditorStore((state) => state.setPhoto);
  const addDoor = useEditorStore((state) => state.addDoor);
  const setFinish = useEditorStore((state) => state.setFinish);

  const [isPicking, setIsPicking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPreparingPackage, setIsPreparingPackage] = useState(false);
  const [isSharingArtifact, setIsSharingArtifact] = useState(false);
  const [isImageReady, setIsImageReady] = useState(false);
  const [lastRenderPackage, setLastRenderPackage] = useState<RenderPackageResult | null>(null);
  const [notice, setNotice] = useState('Galeriden bir mekân fotoğrafı seçerek başlayın.');

  const pickPhoto = useCallback(async () => {
    if (isPicking) {
      return;
    }

    setIsPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setNotice('Fotoğraf seçmek için galeri izni vermeniz gerekiyor.');
        Alert.alert('Galeri izni gerekli', 'İzni cihaz ayarlarından açıp tekrar deneyin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) {
        setNotice('Fotoğraf seçimi iptal edildi.');
        return;
      }

      const asset = result.assets[0];
      if (!asset || asset.width <= 0 || asset.height <= 0) {
        throw new Error('Seçilen fotoğrafın ölçüleri okunamadı.');
      }

      setIsImageReady(false);
      setLastRenderPackage(null);
      setPhoto({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      });
      setNotice('Fotoğraf hazırlanıyor…');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fotoğraf seçilemedi.';
      setNotice(message);
      Alert.alert('Fotoğraf açılamadı', message);
    } finally {
      setIsPicking(false);
    }
  }, [isPicking, setPhoto]);

  const handleImageReady = useCallback(() => {
    setIsImageReady(true);
    setNotice('Fotoğraf hazır. Şimdi örnek kapağı ekleyebilirsiniz.');
  }, []);

  const handleImageError = useCallback((message: string) => {
    setIsImageReady(false);
    setNotice(message);
    Alert.alert('Görsel yüklenemedi', message);
  }, []);

  const handleAddDoor = useCallback(() => {
    setLastRenderPackage(null);
    addDoor();
    setNotice(
      overlayVisible
        ? 'Kapak başlangıç konumuna getirildi.'
        : 'Kapak eklendi. Köşelerdeki büyük tutamaçları sürükleyin.',
    );
  }, [addDoor, overlayVisible]);

  const handleSelectFinish = useCallback(
    (finish: FinishId) => {
      if (finish === selectedFinish) {
        return;
      }
      setLastRenderPackage(null);
      setFinish(finish);
    },
    [selectedFinish, setFinish],
  );

  const handleCornersChanged = useCallback(() => {
    setLastRenderPackage((current) => (current === null ? current : null));
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    setNotice('JPG hazırlanıyor…');
    try {
      const fileUri = await exportAndShareCanvas(canvasRef);
      setNotice(`Paylaşılabilir JPG hazır: ${fileUri.split('/').at(-1) ?? 'sunum.jpg'}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Görsel dışa aktarılamadı.';
      setNotice(message);
      Alert.alert('Dışa aktarma başarısız', message);
    } finally {
      setIsExporting(false);
    }
  }, [canvasRef, isExporting]);

  const shareDebugArtifact = useCallback(async (artifact: DebugArtifact) => {
    if (!lastRenderPackage || isSharingArtifact) {
      return;
    }

    const shareOptions: Record<
      DebugArtifact,
      { uri: string; label: string; mimeType: string; UTI: string }
    > = {
      preview: {
        uri: lastRenderPackage.previewUri,
        label: 'preview.jpg',
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg',
      },
      mask: {
        uri: lastRenderPackage.maskUri,
        label: 'mask.png',
        mimeType: 'image/png',
        UTI: 'public.png',
      },
      selection: {
        uri: lastRenderPackage.selectionUri,
        label: 'selection.json',
        mimeType: 'application/json',
        UTI: 'public.json',
      },
      original: {
        uri: lastRenderPackage.originalUri,
        label: 'original.jpg',
        mimeType: 'image/jpeg',
        UTI: 'public.jpeg',
      },
    };
    const selected = shareOptions[artifact];

    setIsSharingArtifact(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Paylaşım bu cihazda kullanılamıyor.');
      }
      await Sharing.shareAsync(selected.uri, {
        mimeType: selected.mimeType,
        UTI: selected.UTI,
        dialogTitle: `${selected.label} dosyasını paylaş`,
      });
      setNotice(`${selected.label} paylaşım ekranına gönderildi.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : `${selected.label} paylaşılamadı.`;
      setNotice(message);
      Alert.alert('Debug dosyası paylaşılamadı', message);
    } finally {
      setIsSharingArtifact(false);
    }
  }, [isSharingArtifact, lastRenderPackage]);

  const handlePrepareAiPackage = useCallback(async () => {
    if (isPreparingPackage || !photo || !corners) {
      return;
    }

    setIsPreparingPackage(true);
    setLastRenderPackage(null);
    setNotice('AI render paketi hazırlanıyor…');
    try {
      const result = await buildRenderPackage({
        photo,
        canvasSize,
        canvasCorners: corners,
        finishId: selectedFinish,
      });

      setNotice('AI render paketi hazırlandı.');
      setLastRenderPackage(result);
      Alert.alert(
        'AI render paketi hazırlandı.',
        `original.jpg, mask.png, preview.jpg ve selection.json oluşturuldu.\n\n${result.directoryUri}`,
        [{ text: 'Tamam' }],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI render paketi oluşturulamadı.';
      setNotice(message);
      Alert.alert('Paket oluşturulamadı', message);
    } finally {
      setIsPreparingPackage(false);
    }
  }, [canvasSize, corners, isPreparingPackage, photo, selectedFinish]);

  const canEdit = Boolean(photo && isImageReady);
  const canPreparePackage = Boolean(canEdit && overlayVisible && corners);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />

        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.eyebrow}>TEKNİK PROTOTİP</Text>
            <Text style={styles.title}>Mobilyacı Sunum</Text>
          </View>
          <PrimaryButton
            label={isPicking ? 'Açılıyor…' : photo ? 'Fotoğrafı Değiştir' : 'Fotoğraf Seç'}
            onPress={pickPhoto}
            disabled={isPicking}
            compact
          />
        </View>

        <View style={styles.canvasShell}>
          <PhotoCanvas
            canvasRef={canvasRef}
            onImageReady={handleImageReady}
            onImageError={handleImageError}
            onCornersChanged={handleCornersChanged}
          />
          {photo && !isImageReady ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <ActivityIndicator size="large" color="#F2C14E" />
              <Text style={styles.loadingText}>Fotoğraf yükleniyor</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.noticeRow}>
          <View style={[styles.statusDot, canEdit && styles.statusDotReady]} />
          <Text style={styles.notice} numberOfLines={2}>
            {notice}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton
            label={overlayVisible ? 'Kapağı Sıfırla' : 'Kapak Ekle'}
            onPress={handleAddDoor}
            disabled={!canEdit || isPreparingPackage}
          />
          {overlayVisible ? (
            <PrimaryButton
              label={isPreparingPackage ? 'Paket Hazırlanıyor…' : 'AI Paketi Hazırla'}
              onPress={handlePrepareAiPackage}
              disabled={!canPreparePackage || isPreparingPackage || isExporting}
              variant="dark"
            />
          ) : null}
          {lastRenderPackage ? (
            <DebugSharePanel
              disabled={isSharingArtifact || isPreparingPackage}
              onShare={(artifact) => {
                void shareDebugArtifact(artifact);
              }}
            />
          ) : null}
        </View>

        <BottomPanel
          selectedFinish={selectedFinish}
          onSelectFinish={handleSelectFinish}
          colorsDisabled={!overlayVisible}
          exportDisabled={!canEdit}
          isExporting={isExporting}
          onExport={handleExport}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F1EA',
  },
  header: {
    minHeight: 78,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flexShrink: 1,
  },
  eyebrow: {
    color: '#8D6B26',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#222422',
    fontSize: 23,
    fontWeight: '800',
  },
  canvasShell: {
    flex: 1,
    minHeight: 240,
    marginHorizontal: 12,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#181A1C',
    borderWidth: 1,
    borderColor: '#303337',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(24, 26, 28, 0.72)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  noticeRow: {
    minHeight: 42,
    paddingHorizontal: 18,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginTop: 5,
    borderRadius: 4,
    backgroundColor: '#A6A29A',
  },
  statusDotReady: {
    backgroundColor: '#39875B',
  },
  notice: {
    flex: 1,
    color: '#625F58',
    fontSize: 12,
    lineHeight: 17,
  },
  actionRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
});
