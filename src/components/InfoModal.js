import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Platform } from 'react-native';
import { colors, spacing, radius } from '../theme';

export default function InfoModal({ visible, title, children, onClose }) {
  if (!visible) return null;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOverlay}>
        <View style={styles.webModal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.nativeOverlay}>
        <View style={styles.nativeModal}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  webOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  webModal:     { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderAccent, borderRadius: radius.lg, width: '90%', maxWidth: 520, maxHeight: '80%', overflow: 'hidden' },
  nativeOverlay:{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  nativeModal:  { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderAccent, borderRadius: radius.lg, width: '100%', maxHeight: '80%', overflow: 'hidden' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgSecondary },
  title:        { fontSize: 16, fontWeight: '600', color: colors.gold, fontFamily: 'serif' },
  closeBtn:     { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: radius.full, backgroundColor: colors.bgInput },
  closeText:    { color: colors.textSecondary, fontSize: 14 },
  body:         { padding: spacing.md },
});