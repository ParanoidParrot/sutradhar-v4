import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform,
  Alert, StatusBar, ScrollView, Keyboard,
  TouchableWithoutFeedback, Animated
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { colors, spacing, radius, SAMPLE_QUESTIONS } from '../theme';
import { askQuestion, askByVoice, textToSpeech } from '../api';
import InfoModal from '../components/InfoModal';
import useWebScroll from '../hooks/useWebScroll';
import WebScrollView from '../components/WebScrollView';

export default function ChatScreen({ navigation }) {
  const [messages,    setMessages]    = useState([]);
  const [inputText,   setInputText]   = useState('');
  const [language,    setLanguage]    = useState('English');
  const [loading,     setLoading]     = useState(false);
  const [recording,   setRecording]   = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId,   setPlayingId]   = useState(null);
  const [sound,       setSound]       = useState(null);
  const [showSamples, setShowSamples] = useState(true);
  const [modal, setModal] = useState({ visible: false, title: '', content: null });
  const flatListRef  = useRef();
  const scrollContainerRef = useRef();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (Platform.OS === 'web' && scrollContainerRef.current) {
      setTimeout(() => {
        const el = scrollContainerRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 100);
    }
  }, [messages, loading]);

  const showModal = (title, content) => setModal({ visible: true, title, content });
  const hideModal = () => setModal({ visible: false, title: '', content: null });

  // Pulse animation for recording button
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  useEffect(() => {
    return () => { if (sound) sound.unloadAsync(); };
  }, [sound]);

  useEffect(() => {
    if (isRecording) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 600, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      if (pulseLoop.current) pulseLoop.current.stop();
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  // ── Send text question ────────────────────────────────────────────────────
  const handleSend = async (questionText) => {
    const q = (questionText || inputText).trim();
    if (!q || loading) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setInputText('');
    setShowSamples(false);
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: q }]);
    setLoading(true);

    try {
      const res = await askQuestion({ question: q, language });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: res.answer, answer_en: res.answer_en,
        passages: res.passages, language,
      }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', e.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Voice recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Please allow microphone access in Settings.');
        return;
      }
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
    } catch (e) {
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    setLoading(true);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setShowSamples(false);

      const userMsg = { id: Date.now(), role: 'user', text: '🎙️ Voice question...', isVoice: true };
      setMessages(prev => [...prev, userMsg]);

      const res = await askByVoice({ audioUri: uri, language });

      setMessages(prev => prev.map(m =>
        m.id === userMsg.id ? { ...m, text: res.transcript || '🎙️ Voice question' } : m
      ));

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'bot',
        text: res.answer, answer_en: res.answer_en,
        passages: res.passages, language,
      }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Could not process voice. Please try again.');
      setMessages(prev => prev.filter(m => !m.isVoice || m.text !== '🎙️ Voice question...'));
    } finally {
      setLoading(false);
    }
  };

  // ── TTS playback ──────────────────────────────────────────────────────────
  const handleTTS = async (msg) => {
    if (playingId === msg.id) {
      if (sound) { await sound.stopAsync(); setPlayingId(null); }
      return;
    }
    if (Platform.OS !== "web") Haptics.selectionAsync();
    try {
      if (sound) await sound.unloadAsync();
      setPlayingId(msg.id);
      const res = await textToSpeech({ text: msg.text, language: msg.language });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `data:audio/wav;base64,${res.audio_base64}` },
        { shouldPlay: true }
      );
      setSound(newSound);
      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) setPlayingId(null);
      });
    } catch (e) {
      setPlayingId(null);
      Alert.alert('Error', 'Could not play audio');
    }
  };

  // ── Typing indicator ──────────────────────────────────────────────────────
  const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0)).current;
    const dot2 = useRef(new Animated.Value(0)).current;
    const dot3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animate = (dot, delay) =>
        Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue:  0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ]));
      const a1 = animate(dot1, 0);
      const a2 = animate(dot2, 150);
      const a3 = animate(dot3, 300);
      a1.start(); a2.start(); a3.start();
      return () => { a1.stop(); a2.stop(); a3.stop(); };
    }, []);

    return (
      <View style={styles.typingRow}>
        <Text style={styles.avatar}>🧘</Text>
        <View style={styles.typingBubble}>
          <Text style={styles.typingLabel}>Valmiki is composing</Text>
          <View style={styles.dotsRow}>
            {[dot1, dot2, dot3].map((dot, i) => (
              <Animated.View key={i} style={[styles.dot, { transform: [{ translateY: dot }] }]} />
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ── Render message ────────────────────────────────────────────────────────
  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && <Text style={styles.avatar}>🧘</Text>}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.text}
          </Text>
          {!isUser && (
            <View style={styles.msgActions}>
              <TouchableOpacity
                style={[styles.actionBtn, playingId === item.id && styles.actionBtnActive]}
                onPress={() => handleTTS(item)}
              >
                <Text style={styles.actionBtnText}>
                  {playingId === item.id ? '⏹ Stop' : '🔊 Listen'}
                </Text>
              </TouchableOpacity>
              {item.answer_en && item.language !== 'English' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => showModal('Answer in English', <Text style={{ color: colors.textPrimary, fontSize: 14, lineHeight: 22 }}>{item.answer_en}</Text>)}>
                  <Text style={styles.actionBtnText}>View in English</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          {!isUser && item.passages?.length > 0 && (
            <TouchableOpacity onPress={() => showModal('Source Passages',
              <View>{item.passages.map((p, i) => (
                <View key={i} style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12 }}>
                  <Text style={{ color: colors.gold, fontSize: 12, marginBottom: 4 }}>[{i+1}] {p.kanda || p.source || 'Ramayana'}</Text>
                  <Text style={{ color: colors.textPrimary, fontSize: 13, lineHeight: 20 }}>{p.text}</Text>
                </View>
              ))}</View>
            )}>
              <Text style={styles.sourcesLink}>📜 {item.passages.length} source passages</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ── Empty state ───────────────────────────────────────────────────────────
  const EmptyState = () => (
    <WebScrollView style={{ flex: 1 }} contentContainerStyle={styles.samplesContainer}>
      <Text style={styles.samplesTitle}>Ask Valmiki</Text>
      <Text style={styles.samplesSubtitle}>Tap a question or type your own</Text>
      {SAMPLE_QUESTIONS.map((q, i) => (
        <TouchableOpacity key={i} style={styles.sampleChip} onPress={() => handleSend(q)} activeOpacity={0.7}>
          <Text style={styles.sampleText}>{q}</Text>
        </TouchableOpacity>
      ))}
    </WebScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🪔 Sutradhar</Text>
          <Text style={styles.headerSub}>Valmiki · {language}</Text>
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() =>
          navigation.navigate('Language', { currentLanguage: language, onSelect: setLanguage })
        }>
          <Text style={styles.headerBtnText}>🌐</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, overflow: 'hidden' }}>
            {messages.length === 0 && showSamples ? (
              <EmptyState />
            ) : (
              <WebScrollView
                innerRef={flatListRef}
                webRef={scrollContainerRef}
                style={styles.messageScroll}
                contentContainerStyle={styles.messagesList}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
              >
                {messages.map(item => (
                  <View key={item.id.toString()}>
                    {renderMessage({ item })}
                  </View>
                ))}
              </WebScrollView>
            )}
            {loading && <TypingIndicator />}
          </View>

        {/* Input bar - sticky at bottom */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about the Ramayana..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
            blurOnSubmit={true}
            onSubmitEditing={() => handleSend()}
            returnKeyType="send"
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[styles.voiceBtn, isRecording && styles.voiceBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={loading}
            >
              <Text style={styles.voiceBtnText}>{isRecording ? '⏹' : '🎙️'}</Text>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || loading}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      <InfoModal visible={modal.visible} title={modal.title} onClose={hideModal}>
        {modal.content}
      </InfoModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bgPrimary },

  // Header
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bgSecondary },
  headerBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerBtnText:  { fontSize: 20, color: colors.gold },
  headerCenter:   { flex: 1, alignItems: 'center' },
  headerTitle:    { fontSize: 18, color: colors.gold, fontWeight: '700', fontFamily: 'serif' },
  headerSub:      { fontSize: 11, color: colors.textMuted, letterSpacing: 1 },

  // Messages
  messageScroll:  { flex: 1 },
  messagesList:   { padding: spacing.md, paddingBottom: spacing.lg },
  msgRow:         { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  msgRowUser:     { justifyContent: 'flex-end' },
  msgRowBot:      { justifyContent: 'flex-start' },
  avatar:         { fontSize: 24, marginRight: spacing.sm, marginBottom: 4 },
  bubble:         { maxWidth: '80%', borderRadius: radius.md, padding: spacing.md },
  bubbleUser:     { backgroundColor: colors.saffronDim, borderBottomRightRadius: 4 },
  bubbleBot:      { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleText:     { fontSize: 15, lineHeight: 22 },
  bubbleTextUser: { color: colors.textPrimary },
  bubbleTextBot:  { color: colors.textPrimary },
  msgActions:     { flexDirection: 'row', gap: 8, marginTop: spacing.sm, flexWrap: 'wrap' },
  actionBtn:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: colors.borderAccent, backgroundColor: colors.bgSecondary },
  actionBtnActive:{ borderColor: colors.gold, backgroundColor: 'rgba(240,165,0,0.1)' },
  actionBtnText:  { color: colors.textSecondary, fontSize: 12 },
  sourcesLink:    { color: colors.textMuted, fontSize: 11, marginTop: spacing.sm, textDecorationLine: 'underline' },

  // Typing indicator
  typingRow:      { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  typingBubble:   { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, borderBottomLeftRadius: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingLabel:    { color: colors.textMuted, fontSize: 12, fontStyle: 'italic' },
  dotsRow:        { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:            { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.gold, opacity: 0.7 },

  // Empty state
  samplesContainer: { padding: spacing.lg, paddingTop: spacing.xl },
  samplesTitle:     { fontSize: 28, color: colors.gold, fontFamily: 'serif', textAlign: 'center', marginBottom: spacing.xs },
  samplesSubtitle:  { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl, letterSpacing: 0.5 },
  sampleChip:       { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  sampleText:       { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },

  // Input bar
  inputBar:       { flexDirection: 'row', alignItems: 'flex-end', padding: spacing.sm, paddingBottom: Platform.OS === 'ios' ? spacing.md : spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bgSecondary, gap: spacing.sm },
  textInput:      { flex: 1, backgroundColor: colors.bgInput, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: 15, maxHeight: 100 },
  voiceBtn:       { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.borderAccent, alignItems: 'center', justifyContent: 'center' },
  voiceBtnActive: { backgroundColor: 'rgba(192,64,48,0.2)', borderColor: colors.error },
  voiceBtnText:   { fontSize: 20 },
  sendBtn:        { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:{ backgroundColor: colors.goldDim, opacity: 0.5 },
  sendBtnText:    { fontSize: 20, color: colors.bgPrimary, fontWeight: '700' },
});