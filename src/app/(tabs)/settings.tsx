import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { VocabAppLock } from '../../../modules/vocab-app-lock/src';
import { getCardsByDeckId, getDecks, getSetting, setSetting, type Card } from '@/db/queries';
import { Button, colors, PageHeader, Screen, SectionTitle, Surface, TextField } from '@/components/ui';

const lockSettingKey = 'appLockConfig';
const suggestedApps = [
  { name: 'Instagram', packageName: 'com.instagram.android' },
  { name: 'YouTube', packageName: 'com.google.android.youtube' },
  { name: 'TikTok', packageName: 'com.zhiliaoapp.musically' },
  { name: 'Facebook', packageName: 'com.facebook.katana' },
  { name: 'X', packageName: 'com.twitter.android' },
];
const cooldownChoices = [5, 15, 30];

type LockPreferences = { enabled: boolean; packageNames: string[]; customPackages: string; cooldownMinutes: number };
const defaultPreferences: LockPreferences = { enabled: false, packageNames: [], customPackages: '', cooldownMinutes: 15 };

function readPreferences(): LockPreferences {
  try {
    const parsed = JSON.parse(getSetting(lockSettingKey, 'null')) as Partial<LockPreferences> | null;
    if (!parsed) return defaultPreferences;
    const knownPackages = new Set(suggestedApps.map((app) => app.packageName));
    const packageNames = parsed.packageNames ?? [];
    const customPackages = parsed.customPackages || packageNames.filter((name) => !knownPackages.has(name)).join(', ');
    return {
      ...defaultPreferences,
      ...parsed,
      packageNames: packageNames.filter((name) => knownPackages.has(name)),
      customPackages,
    };
  } catch {
    return defaultPreferences;
  }
}

export default function SettingsScreen() {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [serviceEnabled, setServiceEnabled] = useState(false);
  const [unlockCard, setUnlockCard] = useState<Card | null>(null);

  useFocusEffect(useCallback(() => {
    setPreferences(readPreferences());
    const deck = getDecks()[0];
    const card = deck ? getCardsByDeckId(deck.id)[0] : null;
    setUnlockCard(card ?? null);
    if (Platform.OS === 'android' && VocabAppLock) {
      try { setServiceEnabled(VocabAppLock.getStatus().serviceEnabled); } catch { setServiceEnabled(false); }
    }
  }, []));

  const togglePackage = (packageName: string) => {
    setPreferences((current) => ({
      ...current,
      packageNames: current.packageNames.includes(packageName)
        ? current.packageNames.filter((item) => item !== packageName)
        : [...current.packageNames, packageName],
    }));
  };

  const save = () => {
    const customPackages = preferences.customPackages.split(/[\s,;]+/).map((item) => item.trim()).filter(Boolean);
    const packageNames = [...new Set([...preferences.packageNames, ...customPackages])];
    if (preferences.enabled && Platform.OS !== 'android') {
      Alert.alert('僅支援 Android', 'App Lock 需要 Android 無障礙服務；單字本和複習功能仍可正常使用。');
      return;
    }
    if (preferences.enabled && !VocabAppLock) {
      Alert.alert('需要安裝 App Lock 模組', '請使用專案建置的 Android APK，Expo Go 不含這項原生功能。');
      return;
    }
    if (preferences.enabled && packageNames.length === 0) {
      Alert.alert('請選擇要限制的 App', '勾選清單中的 App，或輸入 Android 套件名稱。');
      return;
    }
    if (preferences.enabled && !unlockCard) {
      Alert.alert('先新增一張詞卡', 'App Lock 會以單字卡作為解鎖題目。請先建立單字本並新增詞卡。');
      return;
    }

    const saved: LockPreferences = { ...preferences, packageNames };
    setSetting(lockSettingKey, JSON.stringify(saved));
    if (Platform.OS === 'android' && VocabAppLock) {
      VocabAppLock.setConfig({
        packageNames: saved.enabled ? packageNames : [],
        cooldownMinutes: saved.cooldownMinutes,
        prompt: unlockCard?.definition ?? '',
        answer: unlockCard?.word ?? '',
      });
    }
    Alert.alert('設定已儲存', saved.enabled ? '限制清單已更新。請確認 Android 無障礙服務已開啟。' : 'App Lock 已關閉；你的單字資料仍保留在本機。');
  };

  const openAccessibility = () => {
    if (Platform.OS !== 'android' || !VocabAppLock) {
      Alert.alert('僅支援 Android', '請在使用本專案建置的 Android App 後開啟無障礙服務。');
      return;
    }
    VocabAppLock.openAccessibilitySettings();
  };

  const setEnabled = (enabled: boolean) => {
    if (enabled && Platform.OS !== 'android') {
      Alert.alert('僅支援 Android', 'App Lock 使用 Android 無障礙服務。');
      return;
    }
    setPreferences((current) => ({ ...current, enabled }));
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader eyebrow="PREFERENCES · 個人設定" title="設定" subtitle="管理專注學習功能與裝置上的資料。" />

        <SectionTitle title="專注學習" />
        <Surface style={styles.lockCard}>
          <View style={styles.lockTitleRow}>
            <View style={styles.lockIcon}><Text style={styles.lockIconText}>⌑</Text></View>
            <View style={styles.lockCopy}>
              <Text style={styles.lockTitle}>單字解鎖 App</Text>
              <Text style={styles.lockDescription}>開啟指定 App 前，先答對一題單字。</Text>
            </View>
            <Switch value={preferences.enabled} onValueChange={setEnabled} trackColor={{ false: '#DCE1EA', true: '#9DAAFF' }} thumbColor={preferences.enabled ? colors.blue : '#FFFFFF'} />
          </View>
          <View style={styles.platformNote}>
            <Text style={styles.platformNoteText}>Android 原生功能 · 需要允許「詞伴」使用無障礙服務</Text>
          </View>
          {Platform.OS === 'android' ? (
            <View style={styles.serviceRow}>
              <View style={[styles.serviceDot, serviceEnabled && styles.serviceDotOn]} />
              <Text style={styles.serviceText}>{serviceEnabled ? '無障礙服務已開啟' : '無障礙服務尚未開啟'}</Text>
              <Pressable accessibilityRole="button" onPress={openAccessibility}><Text style={styles.serviceAction}>前往設定</Text></Pressable>
            </View>
          ) : null}
        </Surface>

        <SectionTitle title="選擇限制 App" detail="可複選" />
        <View style={styles.appList}>
          {suggestedApps.map((app) => {
            const selected = preferences.packageNames.includes(app.packageName);
            return (
              <Pressable key={app.packageName} onPress={() => togglePackage(app.packageName)} style={styles.appRow}>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>{selected ? <Text style={styles.checkmark}>✓</Text> : null}</View>
                <View style={styles.appInfo}>
                  <Text style={styles.appName}>{app.name}</Text>
                  <Text style={styles.packageName}>{app.packageName}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <TextField
          label="其他 App 套件名稱（可用逗號分隔）"
          value={preferences.customPackages}
          onChangeText={(customPackages) => setPreferences((current) => ({ ...current, customPackages }))}
          placeholder="例如：com.example.game"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <SectionTitle title="解鎖後暫停時間" />
        <View style={styles.cooldownRow}>
          {cooldownChoices.map((minutes) => {
            const selected = preferences.cooldownMinutes === minutes;
            return (
              <Pressable key={minutes} onPress={() => setPreferences((current) => ({ ...current, cooldownMinutes: minutes }))} style={[styles.cooldown, selected && styles.cooldownSelected]}>
                <Text style={[styles.cooldownText, selected && styles.cooldownTextSelected]}>{minutes} 分鐘</Text>
              </Pressable>
            );
          })}
        </View>

        <Surface style={styles.questionCard}>
          <Text style={styles.questionLabel}>解鎖題目來源</Text>
          {unlockCard ? (
            <>
              <Text style={styles.questionText}>{unlockCard.definition}</Text>
              <Text style={styles.questionHint}>輸入對應英文單字 · {unlockCard.word.length} 個字母</Text>
            </>
          ) : (
            <Text style={styles.questionHint}>新增第一張詞卡後，就能設定單字解鎖題目。</Text>
          )}
        </Surface>

        <Button label="儲存設定" onPress={save} style={styles.saveButton} />

        <SectionTitle title="資料與版本" />
        <Surface style={styles.aboutCard}>
          <View style={styles.aboutRow}><Text style={styles.aboutLabel}>資料儲存</Text><Text style={styles.aboutValue}>僅存於此裝置</Text></View>
          <View style={[styles.aboutRow, styles.aboutDivider]}><Text style={styles.aboutLabel}>帳號與同步</Text><Text style={styles.aboutValue}>目前未提供</Text></View>
          <View style={[styles.aboutRow, styles.aboutDivider]}><Text style={styles.aboutLabel}>App</Text><Text style={styles.aboutValue}>詞伴 · 1.0.0</Text></View>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 32 },
  lockCard: { padding: 16 },
  lockTitleRow: { flexDirection: 'row', alignItems: 'center' },
  lockIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bluePale, marginRight: 11 },
  lockIconText: { color: colors.blue, fontSize: 23, fontWeight: '800' },
  lockCopy: { flex: 1, paddingRight: 7 },
  lockTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  lockDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  platformNote: { backgroundColor: colors.bluePale, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginTop: 14 },
  platformNoteText: { color: colors.blue, fontSize: 11, fontWeight: '700' },
  serviceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  serviceDot: { width: 8, height: 8, borderRadius: 5, backgroundColor: colors.amber, marginRight: 8 },
  serviceDotOn: { backgroundColor: colors.green },
  serviceText: { flex: 1, color: colors.muted, fontSize: 12, fontWeight: '600' },
  serviceAction: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  appList: { gap: 8, marginBottom: 17 },
  appRow: { minHeight: 63, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  checkbox: { width: 22, height: 22, borderWidth: 1.5, borderColor: '#BAC3D2', borderRadius: 7, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxSelected: { borderColor: colors.blue, backgroundColor: colors.blue },
  checkmark: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  appInfo: { flex: 1 },
  appName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  packageName: { color: colors.faint, fontSize: 11, marginTop: 3 },
  cooldownRow: { flexDirection: 'row', gap: 9 },
  cooldown: { flex: 1, minHeight: 45, alignItems: 'center', justifyContent: 'center', borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  cooldownSelected: { borderColor: colors.blue, backgroundColor: colors.bluePale },
  cooldownText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  cooldownTextSelected: { color: colors.blue },
  questionCard: { marginTop: 20, backgroundColor: '#F0F3FF', borderColor: '#E0E6FF' },
  questionLabel: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  questionText: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 8 },
  questionHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 },
  saveButton: { marginTop: 16 },
  aboutCard: { paddingVertical: 2 },
  aboutRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aboutDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  aboutLabel: { color: colors.muted, fontSize: 13 },
  aboutValue: { color: colors.ink, fontSize: 13, fontWeight: '700' },
});
