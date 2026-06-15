import React, { useEffect, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';

interface LibrasVideoModalProps {
  visible: boolean;
  title: string;
  videoUri: string;
  caption?: string;
  onClose: () => void;
  onSave?: (videoUri: string) => void;
}

export function LibrasVideoModal({ visible, title, videoUri, caption, onClose, onSave }: LibrasVideoModalProps) {
  const videoRef = useRef<Video>(null);
  const [currentVideoUri, setCurrentVideoUri] = useState(videoUri);
  const [hasUnsavedChange, setHasUnsavedChange] = useState(false);

  useEffect(() => {
    setCurrentVideoUri(videoUri);
  }, [videoUri]);

  useEffect(() => {
    if (!visible) {
      videoRef.current?.pauseAsync().catch(() => undefined);
      return;
    }

    videoRef.current?.pauseAsync().catch(() => undefined);
    if (!currentVideoUri) {
      videoRef.current?.unloadAsync().catch(() => undefined);
    }
  }, [currentVideoUri, visible]);

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setCurrentVideoUri(result.assets[0].uri);
        setHasUnsavedChange(true);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar um vídeo da galeria.');
    }
  };

  const handleSave = async () => {
    if (!onSave) return;

    await onSave(currentVideoUri);
    setHasUnsavedChange(false);
    Alert.alert('Vídeo atualizado', 'A alteração foi salva com sucesso.');
  };

  const handleDeleteVideo = async () => {
    Alert.alert('Excluir vídeo', 'Deseja remover este vídeo do termo em Libras?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            if (onSave) {
              await onSave('');
            }
            setCurrentVideoUri('');
            await videoRef.current?.unloadAsync().catch(() => undefined);
            setHasUnsavedChange(false);
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir o vídeo neste momento.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.headerActions}>
              {hasUnsavedChange && onSave ? (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveText}>Salvar</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={styles.actionButton} onPress={handlePickVideo}>
                <Text style={styles.actionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteVideo}>
                <Text style={styles.deleteText}>Excluir vídeo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.videoBox}>
            <Video
              ref={videoRef}
              source={{ uri: currentVideoUri }}
              style={styles.video}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={visible}
              isLooping={false}
            />
          </View>
          <Text style={styles.helper}>Vídeo em Libras para apoio de acessibilidade.</Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 17, 31, 0.95)',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#12253C',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#253A53',
  },
  headerRow: { flexDirection: 'column', marginBottom: 8 },
  title: { color: '#FFF', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  headerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  actionButton: { backgroundColor: '#1D4ED8', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  actionText: { color: '#FFF', fontWeight: '700' },
  deleteButton: { backgroundColor: '#DC2626', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  deleteText: { color: '#FFF', fontWeight: '700' },
  saveButton: { backgroundColor: '#10B981', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  saveText: { color: '#FFF', fontWeight: '700' },
  closeButton: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  closeText: { color: '#FFF', fontWeight: '700' },
  videoBox: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0F1C2B' },
  video: { width: '100%', height: 260 },
  helper: { color: '#BFDBFE', marginTop: 8, fontSize: 12 },
  caption: { color: '#E0F2FE', marginTop: 6, fontSize: 13 },
});
