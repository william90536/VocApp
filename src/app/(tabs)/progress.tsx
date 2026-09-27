import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getRecentAttempts, getStudySummary, type RecentAttempt, type StudySummary } from '@/db/queries';
import { colors, EmptyState, PageHeader, Screen, SectionTitle, StatTile, Surface } from '@/components/ui';

const emptySummary: StudySummary = {
  deckCount: 0,
  cardCount: 0,
  starredCount: 0,
  masteredCount: 0,
  todayAttempts: 0,
  weekAttempts: 0,
  accuracy: 0,
  week: [],
};

const modeLabels: Record<string, string> = {
  choice: '中文選擇',
  write: '英文拼字',
  mixed: '混合測驗',
  flashcard: '翻卡複習',
};

export default function ProgressScreen() {
  const [summary, setSummary] = useState(emptySummary);
  const [recent, setRecent] = useState<RecentAttempt[]>([]);

  useFocusEffect(useCallback(() => {
    setSummary(getStudySummary());
    setRecent(getRecentAttempts());
  }, []));

  const maxAttempts = Math.max(1, ...summary.week.map((day) => day.attempts));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <PageHeader eyebrow="STUDY OVERVIEW · 持續累積" title="學習總覽" subtitle="看看你的練習節奏，下一個單字就從今天開始。" />

        <Surface style={styles.todayCard}>
          <View style={styles.todayTop}>
            <View>
              <Text style={styles.todayCaption}>今天完成</Text>
              <Text style={styles.todayNumber}>{summary.todayAttempts}<Text style={styles.todayUnit}> 題</Text></Text>
            </View>
            <View style={styles.todayIcon}><Text style={styles.todayIconText}>✦</Text></View>
          </View>
          <View style={styles.todayTrack}><View style={[styles.todayFill, { width: `${Math.min(100, summary.todayAttempts * 10)}%` }]} /></View>
          <Text style={styles.todayFootnote}>每天 10 題，慢慢把記憶變成習慣。</Text>
        </Surface>

        <SectionTitle title="學習成果" />
        <View style={styles.statsRow}>
          <StatTile label="本週練習" value={summary.weekAttempts} />
          <StatTile label="答題正確率" value={recent.length || summary.weekAttempts ? `${summary.accuracy}%` : '—'} tint="green" />
        </View>
        <View style={[styles.statsRow, styles.secondStatsRow]}>
          <StatTile label="熟悉單字" value={summary.masteredCount} tint="green" />
          <StatTile label="收藏單字" value={summary.starredCount} tint="amber" />
        </View>

        <SectionTitle title="近七日練習" detail={`共 ${summary.weekAttempts} 題`} />
        <Surface style={styles.chartCard}>
          <View style={styles.chart}>
            {summary.week.map((day) => (
              <View key={day.date} style={styles.chartColumn}>
                <Text style={styles.chartValue}>{day.attempts || ''}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { height: `${Math.max(5, (day.attempts / maxAttempts) * 100)}%` }, day.attempts === 0 && styles.barEmpty]} />
                </View>
                <Text style={styles.dayLabel}>{day.label}</Text>
              </View>
            ))}
          </View>
        </Surface>

        <SectionTitle title="最近練習" />
        {recent.length ? (
          <Surface style={styles.recentList}>
            {recent.map((attempt, index) => (
              <View key={attempt.id} style={[styles.attemptRow, index < recent.length - 1 && styles.attemptDivider]}>
                <View style={[styles.resultDot, attempt.is_correct ? styles.resultGood : styles.resultMiss]}>
                  <Text style={[styles.resultDotText, attempt.is_correct ? styles.resultGoodText : styles.resultMissText]}>{attempt.is_correct ? '✓' : '·'}</Text>
                </View>
                <View style={styles.attemptInfo}>
                  <Text style={styles.attemptWord}>{attempt.word}</Text>
                  <Text style={styles.attemptMode}>{modeLabels[attempt.mode] ?? '單字練習'}</Text>
                </View>
                <Text style={styles.attemptTime}>{new Date(attempt.created_at).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            ))}
          </Surface>
        ) : (
          <EmptyState title="你的練習紀錄會出現在這裡" description="打開任一單字本，完成翻卡複習或測驗後即可查看進度。" />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  todayCard: { padding: 20, backgroundColor: colors.blue, borderColor: colors.blue, overflow: 'hidden' },
  todayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  todayCaption: { color: '#DCE3FF', fontSize: 14, fontWeight: '700' },
  todayNumber: { color: '#FFFFFF', fontSize: 39, lineHeight: 47, fontWeight: '800', marginTop: 4 },
  todayUnit: { fontSize: 17 },
  todayIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.17)' },
  todayIconText: { color: '#FFFFFF', fontSize: 25 },
  todayTrack: { height: 8, borderRadius: 9, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 18 },
  todayFill: { height: '100%', borderRadius: 9, backgroundColor: '#FFFFFF' },
  todayFootnote: { color: '#E4E8FF', fontSize: 12, marginTop: 9 },
  statsRow: { flexDirection: 'row', gap: 10 },
  secondStatsRow: { marginTop: 10 },
  chartCard: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 11 },
  chart: { height: 132, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'space-around' },
  chartColumn: { flex: 1, alignItems: 'center' },
  chartValue: { height: 18, color: colors.muted, fontSize: 11, fontWeight: '700' },
  barTrack: { flex: 1, width: 23, justifyContent: 'flex-end', borderRadius: 99, backgroundColor: '#F0F2F7', overflow: 'hidden' },
  bar: { width: '100%', minHeight: 5, borderRadius: 99, backgroundColor: colors.blue },
  barEmpty: { backgroundColor: '#DCE2EF' },
  dayLabel: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 8 },
  recentList: { paddingHorizontal: 15, paddingVertical: 2 },
  attemptRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center' },
  attemptDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  resultDot: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 11, marginRight: 12 },
  resultGood: { backgroundColor: colors.greenPale },
  resultMiss: { backgroundColor: colors.redPale },
  resultDotText: { fontSize: 16, fontWeight: '800' },
  resultGoodText: { color: colors.green },
  resultMissText: { color: colors.red },
  attemptInfo: { flex: 1 },
  attemptWord: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  attemptMode: { color: colors.muted, fontSize: 12, marginTop: 3 },
  attemptTime: { color: colors.faint, fontSize: 12 },
});
