import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, SafeAreaView, StatusBar, ScrollView
} from 'react-native';
import { colors, spacing, radius } from '../theme';

export default function HomeScreen({ navigation }) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Diya emoji header */}
        <Text style={styles.diya}>🪔</Text>

        {/* Title */}
        <Text style={styles.title}>Sutradhar</Text>
        <Text style={styles.subtitle}>सूत्रधार</Text>
        <Text style={styles.tagline}>The Storyteller</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Description */}
        <Text style={styles.description}>
          Ask questions about the Ramayana in your language.{'\n'}
          Answered by sage Valmiki himself.
        </Text>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate('Chat')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Begin</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by Sarvam AI · 10 Indian Languages
        </Text>

      </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  diya: {
    fontSize: 56,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: colors.gold,
    letterSpacing: 2,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 22,
    color: colors.saffron,
    marginTop: spacing.xs,
    letterSpacing: 4,
    fontFamily: 'serif',
  },
  tagline: {
    fontSize: 13,
    color: colors.textMuted,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  divider: {
    width: 60,
    height: 1,
    backgroundColor: colors.goldDim,
    marginVertical: spacing.lg,
    opacity: 0.6,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  ctaButton: {
    backgroundColor: colors.gold,
    paddingVertical: 14,
    paddingHorizontal: 56,
    borderRadius: radius.full,
    marginBottom: spacing.xl,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaText: {
    color: colors.bgPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footer: {
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
    position: 'absolute',
    bottom: spacing.lg,
  },
});