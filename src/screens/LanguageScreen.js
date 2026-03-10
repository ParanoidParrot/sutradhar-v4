import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform
} from 'react-native';
import { colors, spacing, radius, LANGUAGES } from '../theme';
import useWebScroll from '../hooks/UseWebScroll';
import WebScrollView from '../components/WebScrollView';

export default function LanguageScreen({ navigation, route }) {
  const currentLanguage = route.params?.currentLanguage || 'English';
  const onSelect        = route.params?.onSelect;
  useWebScroll();
  const scrollRef = useRef();

  useEffect(() => {
    if (Platform.OS === 'web' && scrollRef.current) {
      const node = scrollRef.current._nativeTag || scrollRef.current;
      if (node && node.style) { node.style.overflowY = 'auto'; node.style.height = '100%'; }
    }
  }, []);

  const handleSelect = (lang) => {
    if (onSelect) onSelect(lang.label);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={styles.subtitle}>Choose your preferred language</Text>

      <WebScrollView
        style={styles.scroll}
        contentContainerStyle={styles.list}
      >
        {LANGUAGES.map(item => {
          const isSelected = item.label === currentLanguage;
          return (
            <TouchableOpacity
              key={item.code}
              style={[styles.langItem, isSelected && styles.langItemSelected]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={[styles.langLabel, isSelected && styles.langLabelSelected]}>
                {item.label}
              </Text>
              {isSelected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </WebScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: colors.bgPrimary },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:           { padding: spacing.xs },
  backText:          { color: colors.gold, fontSize: 15 },
  headerTitle:       { fontSize: 18, color: colors.textPrimary, fontWeight: '600', fontFamily: 'serif' },
  subtitle:          { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginVertical: spacing.md, letterSpacing: 0.5 },
  scroll:            { flex: 1, ...(Platform.OS === 'web' ? { height: '100%', overflowY: 'auto' } : {}) },
  list:              { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  langItem:          { flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border },
  langItemSelected:  { borderColor: colors.gold, backgroundColor: 'rgba(240,165,0,0.08)' },
  langLabel:         { flex: 1, fontSize: 16, color: colors.textSecondary, fontWeight: '500' },
  langLabelSelected: { color: colors.gold },
  checkmark:         { color: colors.gold, fontSize: 16, fontWeight: '700' },
});