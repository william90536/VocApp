import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { addDeck, getDecks, getStudySummary, type Deck } from '@/db/queries';
import { Button, colors, EmptyState, FormSheet, PageHeader, SectionTitle, StatTile, TextField, Screen } from '@/components/ui';

export default function DecksScreen() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [search, setSearch] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const refresh = useCallback(() => {
    setDecks(getDecks());
    setTodayCount(getStudySummary().todayAttempts);
  }, []);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const visibleDecks = decks.filter((deck) =>
    `${deck.title} ${deck.description}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const totalCards = decks.reduce((total, deck) => total + deck.card_count, 0);

  const createDeck = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('請輸入單字本名稱', '名稱不能留白。');
      return;
    }
    const id = addDeck(cleanTitle, description);
    setTitle('');
    setDescription('');
    setSheetVisible(false);
    refresh();
    router.push({ pathname: '/deck/[id]', params: { id } });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <PageHeader eyebrow="VOCAB MATE · 英文學習" title="我的單字本" subtitle="把想記住的單字，整理成自己的學習清單。" />
          <Pressable accessibilityRole="button" accessibilityLabel="新增單字本" onPress={() => setSheetVisible(true)} style={styles.addButton}>
            <Text style={styles.addButtonText}>＋</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <StatTile label="單字本" value={decks.length} />
          <StatTile label="總詞卡" value={totalCards} tint="green" />
          <StatTile label="今日複習" value={todayCount} tint="amber" />
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            accessibilityLabel="搜尋單字本"
            value={search}
            onChangeText={setSearch}
            placeholder="搜尋單字本"
            placeholderTextColor={colors.faint}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search ? <Pressable onPress={() => setSearch('')} hitSlop={10}><Text style={styles.clearSearch}>清除</Text></Pressable> : null}
        </View>

        <SectionTitle title="單字本清單" detail={`${visibleDecks.length} 份`} />
        {visibleDecks.length ? (
          <View style={styles.deckList}>
            {visibleDecks.map((deck, index) => (
              <Pressable
                key={deck.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/deck/[id]', params: { id: deck.id } })}
                style={({ pressed }) => [styles.deckCard, pressed && styles.pressed]}>
                <View style={[styles.deckMark, index % 3 === 1 && styles.deckMarkGreen, index % 3 === 2 && styles.deckMarkAmber]}>
                  <Text style={styles.deckMarkText}>{deck.title.trim().slice(0, 1).toUpperCase() || 'A'}</Text>
                </View>
                <View style={styles.deckInfo}>
                  <Text numberOfLines={1} style={styles.deckTitle}>{deck.title}</Text>
                  <Text numberOfLines={1} style={styles.deckDescription}>{deck.description || '尚未新增單字說明'}</Text>
                  <Text style={styles.deckCount}>{deck.card_count} 張詞卡</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState
            title={search ? '找不到符合的單字本' : '從第一份單字本開始'}
            description={search ? '換個關鍵字試試看。' : '依照課程、主題或目標考試建立清單，接著加入要學習的單字。'}
            action={!search ? { label: '建立單字本', onPress: () => setSheetVisible(true) } : undefined}
          />
        )}
      </ScrollView>

      <FormSheet visible={sheetVisible} title="建立單字本" onClose={() => setSheetVisible(false)}>
        <TextField label="名稱" value={title} onChangeText={setTitle} placeholder="例如：日常會話、TOEIC 必考字" returnKeyType="next" />
        <TextField label="說明（選填）" value={description} onChangeText={setDescription} placeholder="簡單記下這份清單的學習目標" multiline />
        <Button label="建立單字本" onPress={createDeck} />
      </FormSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  addButton: { width: 47, height: 47, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, marginTop: 9 },
  addButtonText: { color: '#FFFFFF', fontSize: 29, lineHeight: 33, fontWeight: '400' },
  statsRow: { flexDirection: 'row', gap: 9, marginBottom: 18 },
  searchBox: { height: 51, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  searchGlyph: { color: colors.muted, fontSize: 24, marginRight: 9, marginTop: -3 },
  searchInput: { flex: 1, height: '100%', color: colors.ink, fontSize: 15 },
  clearSearch: { color: colors.blue, fontWeight: '700', fontSize: 13 },
  deckList: { gap: 10 },
  deckCard: { minHeight: 98, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 18, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border },
  pressed: { opacity: 0.76 },
  deckMark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: colors.bluePale, marginRight: 13 },
  deckMarkGreen: { backgroundColor: '#E1F5EC' },
  deckMarkAmber: { backgroundColor: '#FFF2D7' },
  deckMarkText: { color: colors.blue, fontSize: 23, fontWeight: '800' },
  deckInfo: { flex: 1, minWidth: 0 },
  deckTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  deckDescription: { color: colors.muted, fontSize: 13, marginTop: 4 },
  deckCount: { color: colors.blue, fontSize: 12, fontWeight: '700', marginTop: 8 },
  chevron: { color: '#9BA5B7', fontSize: 29, marginLeft: 8 },
});
