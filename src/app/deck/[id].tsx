import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  addCard,
  deleteCard,
  deleteDeck,
  getCardsByDeckId,
  getDeckById,
  toggleCardStarred,
  updateCard,
  updateDeck,
  type Card,
  type Deck,
} from '@/db/queries';
import { Button, colors, EmptyState, FormSheet, PageHeader, Screen, SectionTitle, Surface, TextField } from '@/components/ui';

type CardFormValues = { word: string; phonetic: string; definition: string; example: string };
const blankCard: CardFormValues = { word: '', phonetic: '', definition: '', example: '' };

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [search, setSearch] = useState('');
  const [cardSheetVisible, setCardSheetVisible] = useState(false);
  const [deckSheetVisible, setDeckSheetVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [cardForm, setCardForm] = useState(blankCard);
  const [deckTitle, setDeckTitle] = useState('');
  const [deckDescription, setDeckDescription] = useState('');

  const refresh = useCallback(() => {
    if (!id) return;
    setDeck(getDeckById(id));
    setCards(getCardsByDeckId(id));
  }, [id]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const visibleCards = cards.filter((card) =>
    `${card.word} ${card.phonetic} ${card.definition} ${card.example}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  const openCardForm = (card?: Card) => {
    setEditingCard(card ?? null);
    setCardForm(card ? {
      word: card.word,
      phonetic: card.phonetic ?? '',
      definition: card.definition,
      example: card.example ?? '',
    } : blankCard);
    setCardSheetVisible(true);
  };

  const saveCard = () => {
    if (!deck || !cardForm.word.trim() || !cardForm.definition.trim()) {
      Alert.alert('請補上必要資料', '英文單字和中文釋義都需要填寫。');
      return;
    }
    if (editingCard) updateCard(editingCard.id, cardForm);
    else addCard(deck.id, cardForm.word, cardForm.definition, cardForm.phonetic, cardForm.example);
    setCardSheetVisible(false);
    refresh();
  };

  const openDeckForm = () => {
    if (!deck) return;
    setDeckTitle(deck.title);
    setDeckDescription(deck.description ?? '');
    setDeckSheetVisible(true);
  };

  const saveDeck = () => {
    if (!deckTitle.trim() || !deck) {
      Alert.alert('請輸入單字本名稱', '名稱不能留白。');
      return;
    }
    updateDeck(deck.id, deckTitle, deckDescription);
    setDeckSheetVisible(false);
    refresh();
  };

  const removeDeck = () => {
    if (!deck) return;
    Alert.alert('刪除這份單字本？', `「${deck.title}」和裡面的詞卡、學習紀錄都會刪除。`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除單字本', style: 'destructive', onPress: () => { deleteDeck(deck.id); router.back(); } },
    ]);
  };

  const removeCard = (card: Card) => {
    Alert.alert('刪除這張詞卡？', `將刪除「${card.word}」及它的學習紀錄。`, [
      { text: '取消', style: 'cancel' },
      { text: '刪除詞卡', style: 'destructive', onPress: () => { deleteCard(card.id); refresh(); } },
    ]);
  };

  const startStudy = (mode: 'flashcards' | 'choice' | 'write' | 'mixed') => {
    if (!deck || cards.length === 0) return;
    router.push({ pathname: '/study/[deckId]', params: { deckId: deck.id, mode } });
  };

  if (!deck) {
    return <Screen><View style={styles.missing}><EmptyState title="找不到這份單字本" description="它可能已經被刪除。" action={{ label: '回到單字本', onPress: () => router.replace('/(tabs)/index') }} /></View></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.backLink}>‹  單字本</Text></Pressable>
          <View style={styles.topActions}>
            <Pressable onPress={openDeckForm} hitSlop={10}><Text style={styles.topAction}>編輯</Text></Pressable>
            <Pressable onPress={removeDeck} hitSlop={10}><Text style={[styles.topAction, styles.deleteAction]}>刪除</Text></Pressable>
          </View>
        </View>

        <PageHeader eyebrow="單字本" title={deck.title} subtitle={deck.description || '為這份單字清單加入一段學習目標。'} />

        <Surface style={styles.deckSummary}>
          <Text style={styles.summaryCount}>{cards.length}</Text>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>張詞卡</Text>
            <Text style={styles.summarySubtitle}>{cards.filter((card) => card.mastery_level >= 3).length} 張已熟悉 · {cards.filter((card) => card.is_starred === 1).length} 張收藏</Text>
          </View>
          <Text style={styles.summaryGlyph}>✦</Text>
        </Surface>

        <SectionTitle title="開始練習" />
        <Button label="翻卡複習" onPress={() => startStudy('flashcards')} disabled={!cards.length} style={styles.studyButton} />
        <View style={styles.modeRow}>
          <ModeButton title="中文選擇" hint="看英文選意思" onPress={() => startStudy('choice')} disabled={cards.length < 2} />
          <ModeButton title="英文拼字" hint="看中文寫單字" onPress={() => startStudy('write')} disabled={!cards.length} />
          <ModeButton title="混合測驗" hint="交錯練習" onPress={() => startStudy('mixed')} disabled={!cards.length} />
        </View>
        {cards.length === 1 ? <Text style={styles.modeHint}>選擇題需要至少兩張詞卡；目前仍可翻卡或練習拼字。</Text> : null}

        <View style={styles.cardsHeader}>
          <SectionTitle title="詞卡" detail={`${visibleCards.length} 張`} />
          <Pressable onPress={() => openCardForm()} style={styles.addCardButton}><Text style={styles.addCardText}>＋ 新增</Text></Pressable>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="搜尋這份單字本" placeholderTextColor={colors.faint} style={styles.searchInput} />
        </View>

        {visibleCards.length ? (
          <View style={styles.cardList}>
            {visibleCards.map((card) => (
              <Surface key={card.id} style={styles.wordCard}>
                <View style={styles.wordRow}>
                  <Pressable onPress={() => openCardForm(card)} style={styles.wordCopy}>
                    <View style={styles.wordTitleRow}>
                      <Text style={styles.word}>{card.word}</Text>
                      {card.phonetic ? <Text style={styles.phonetic}>{card.phonetic}</Text> : null}
                    </View>
                    <Text style={styles.definition}>{card.definition}</Text>
                    {card.example ? <Text style={styles.example}>“{card.example}”</Text> : null}
                  </Pressable>
                  <Pressable accessibilityRole="button" accessibilityLabel={card.is_starred ? '取消收藏' : '收藏'} onPress={() => { toggleCardStarred(card.id); refresh(); }} hitSlop={9} style={styles.starButton}>
                    <Text style={[styles.star, card.is_starred === 1 && styles.starSelected]}>{card.is_starred === 1 ? '★' : '☆'}</Text>
                  </Pressable>
                </View>
                <View style={styles.wordFooter}>
                  <View style={styles.masteryTrack}><View style={[styles.masteryFill, { width: `${Math.min(100, card.mastery_level * 20)}%` }]} /></View>
                  <Text style={styles.masteryLabel}>{card.mastery_level >= 3 ? '已熟悉' : '繼續練習'}</Text>
                  <Pressable onPress={() => removeCard(card)} hitSlop={8}><Text style={styles.deleteCard}>刪除</Text></Pressable>
                </View>
              </Surface>
            ))}
          </View>
        ) : (
          <EmptyState
            title={search ? '沒有符合的詞卡' : '這份單字本還是空的'}
            description={search ? '試試其他單字或釋義。' : '新增第一張詞卡，再開始翻卡或測驗。'}
            action={!search ? { label: '新增詞卡', onPress: () => openCardForm() } : undefined}
          />
        )}
      </ScrollView>

      <FormSheet visible={cardSheetVisible} title={editingCard ? '編輯詞卡' : '新增詞卡'} onClose={() => setCardSheetVisible(false)}>
        <TextField label="英文單字" value={cardForm.word} onChangeText={(word) => setCardForm((form) => ({ ...form, word }))} placeholder="例如：resilient" autoCapitalize="none" autoCorrect={false} />
        <TextField label="音標（選填）" value={cardForm.phonetic} onChangeText={(phonetic) => setCardForm((form) => ({ ...form, phonetic }))} placeholder="例如：/rɪˈzɪliənt/" />
        <TextField label="中文釋義" value={cardForm.definition} onChangeText={(definition) => setCardForm((form) => ({ ...form, definition }))} placeholder="例如：有韌性的" />
        <TextField label="例句（選填）" value={cardForm.example} onChangeText={(example) => setCardForm((form) => ({ ...form, example }))} placeholder="輸入英文例句" multiline />
        <Button label={editingCard ? '儲存變更' : '新增詞卡'} onPress={saveCard} />
      </FormSheet>

      <FormSheet visible={deckSheetVisible} title="編輯單字本" onClose={() => setDeckSheetVisible(false)}>
        <TextField label="名稱" value={deckTitle} onChangeText={setDeckTitle} placeholder="輸入單字本名稱" />
        <TextField label="說明（選填）" value={deckDescription} onChangeText={setDeckDescription} placeholder="記下這份清單的學習目標" multiline />
        <Button label="儲存變更" onPress={saveDeck} />
      </FormSheet>
    </Screen>
  );
}

function ModeButton({ title, hint, onPress, disabled }: { title: string; hint: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.modeButton, disabled && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.modeTitle}>{title}</Text>
      <Text style={styles.modeDescription}>{hint}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 35 },
  missing: { flex: 1, justifyContent: 'center' },
  topBar: { minHeight: 43, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  backLink: { color: colors.blue, fontSize: 15, fontWeight: '800' },
  topActions: { flexDirection: 'row', gap: 17 },
  topAction: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  deleteAction: { color: colors.red },
  deckSummary: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#EEF1FF', borderColor: '#E0E5FF' },
  summaryCount: { color: colors.blue, fontSize: 32, fontWeight: '800', marginRight: 12 },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  summarySubtitle: { color: colors.muted, fontSize: 12, marginTop: 4 },
  summaryGlyph: { color: colors.blue, fontSize: 24 },
  studyButton: { minHeight: 55 },
  modeRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  modeButton: { flex: 1, minHeight: 76, justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 15 },
  modeTitle: { color: colors.blue, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  modeDescription: { color: colors.muted, fontSize: 10, textAlign: 'center', marginTop: 5 },
  disabled: { opacity: 0.42 },
  pressed: { opacity: 0.73 },
  modeHint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 9 },
  cardsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  addCardButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.bluePale, borderRadius: 11 },
  addCardText: { color: colors.blue, fontSize: 13, fontWeight: '800' },
  searchBox: { height: 47, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 13, marginBottom: 11 },
  searchGlyph: { color: colors.muted, fontSize: 22, marginRight: 8 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  cardList: { gap: 10 },
  wordCard: { padding: 15 },
  wordRow: { flexDirection: 'row', alignItems: 'flex-start' },
  wordCopy: { flex: 1 },
  wordTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 9 },
  word: { color: colors.ink, fontSize: 19, fontWeight: '800' },
  phonetic: { color: colors.muted, fontSize: 13 },
  definition: { color: colors.ink, fontSize: 15, marginTop: 7 },
  example: { color: colors.muted, fontSize: 13, fontStyle: 'italic', lineHeight: 19, marginTop: 8 },
  starButton: { paddingLeft: 12, paddingVertical: 2 },
  star: { color: '#A1AABD', fontSize: 24 },
  starSelected: { color: '#E4A323' },
  wordFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 13 },
  masteryTrack: { width: 50, height: 5, borderRadius: 8, backgroundColor: '#E8ECF3', overflow: 'hidden', marginRight: 7 },
  masteryFill: { height: '100%', borderRadius: 8, backgroundColor: colors.green },
  masteryLabel: { flex: 1, color: colors.muted, fontSize: 11 },
  deleteCard: { color: colors.red, fontSize: 12, fontWeight: '700' },
});
