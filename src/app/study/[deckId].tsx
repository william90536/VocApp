import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { getCardsByDeckId, getDeckById, recordStudyAttempt, type Card, type Deck } from '@/db/queries';
import { Button, colors, EmptyState, Screen, Surface } from '@/components/ui';

type StudyMode = 'flashcards' | 'choice' | 'write' | 'mixed';
type QuestionMode = 'choice' | 'write';

const modeTitle: Record<StudyMode, string> = {
  flashcards: '翻卡複習',
  choice: '中文選擇',
  write: '英文拼字',
  mixed: '混合測驗',
};

function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function normalizeAnswer(value: string) {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export default function StudyScreen() {
  const { deckId, mode } = useLocalSearchParams<{ deckId: string; mode?: string }>();
  const router = useRouter();
  const requestedMode: StudyMode = mode === 'choice' || mode === 'write' || mode === 'mixed' ? mode : 'flashcards';
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [answer, setAnswer] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!deckId) return;
    setDeck(getDeckById(deckId));
    setCards(shuffled(getCardsByDeckId(deckId)));
    setIndex(0);
    setFlipped(false);
    setAnswer('');
    setSelectedAnswer('');
    setChecked(false);
    setWasCorrect(false);
    setCorrectCount(0);
    setFinished(false);
  }, [deckId]));

  const card = cards[index];
  const choices = useMemo(() => {
    if (!card) return [];
    const definitions = [...new Set(cards.filter((item) => item.id !== card.id).map((item) => item.definition))];
    return shuffled([...definitions.slice(0, 3), card.definition]);
  }, [card?.id, cards]);

  const questionMode: QuestionMode = requestedMode === 'mixed'
    ? (index % 2 === 0 && cards.length > 1 ? 'choice' : 'write')
    : requestedMode === 'choice' && choices.length < 2 ? 'write'
      : requestedMode === 'choice' ? 'choice' : 'write';

  const advance = () => {
    if (index >= cards.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setFlipped(false);
    setAnswer('');
    setSelectedAnswer('');
    setChecked(false);
    setWasCorrect(false);
  };

  const answerQuestion = (value: string) => {
    if (!card || checked || !value.trim()) return;
    const expected = questionMode === 'choice' ? card.definition : card.word;
    const correct = normalizeAnswer(value) === normalizeAnswer(expected);
    setSelectedAnswer(value);
    setWasCorrect(correct);
    setChecked(true);
    if (correct) setCorrectCount((count) => count + 1);
    recordStudyAttempt(card.id, questionMode, correct);
  };

  const finishCard = (remembered: boolean) => {
    if (!card) return;
    recordStudyAttempt(card.id, 'flashcard', remembered);
    if (remembered) setCorrectCount((count) => count + 1);
    advance();
  };

  if (finished) {
    const percent = cards.length ? Math.round((correctCount / cards.length) * 100) : 0;
    return (
      <Screen style={styles.resultScreen}>
        <View style={styles.resultContent}>
          <View style={styles.resultIcon}><Text style={styles.resultIconText}>✓</Text></View>
          <Text style={styles.resultEyebrow}>練習完成</Text>
          <Text style={styles.resultTitle}>{requestedMode === 'flashcards' ? '又記住了一些單字' : '做得很好，繼續保持'}</Text>
          <Text style={styles.resultSubtitle}>{deck?.title ?? '單字本'} · {modeTitle[requestedMode]}</Text>
          <Surface style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{requestedMode === 'flashcards' ? `${cards.length}` : `${percent}%`}</Text>
            <Text style={styles.scoreLabel}>{requestedMode === 'flashcards' ? `已完成 ${cards.length} 張詞卡複習` : `答對 ${correctCount} 題，共 ${cards.length} 題`}</Text>
          </Surface>
          <Button label="回到單字本" onPress={() => router.back()} style={styles.finishButton} />
        </View>
      </Screen>
    );
  }

  if (!cards.length) {
    return (
      <Screen>
        <View style={styles.emptyWrap}>
          <EmptyState title="還沒有詞卡可以練習" description="先回到單字本，新增幾張詞卡再開始練習。" action={{ label: '回到單字本', onPress: () => router.back() }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}><Text style={styles.exit}>‹  離開</Text></Pressable>
          <View style={styles.topTitle}><Text numberOfLines={1} style={styles.deckName}>{deck?.title ?? '單字複習'}</Text><Text style={styles.modeName}>{modeTitle[requestedMode]}</Text></View>
          <Text style={styles.counter}>{index + 1}<Text style={styles.counterMuted}> / {cards.length}</Text></Text>
        </View>

        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${((index + 1) / cards.length) * 100}%` }]} /></View>

        {requestedMode === 'flashcards' ? (
          <View style={styles.flashcardArea}>
            <Pressable accessibilityRole="button" accessibilityLabel={flipped ? '顯示英文單字' : '翻開查看中文釋義'} onPress={() => setFlipped((value) => !value)} style={[styles.flashcard, flipped && styles.flashcardBack]}>
              <View style={styles.cardMetaRow}>
                <Text style={[styles.cardMeta, flipped && styles.lightText]}>{flipped ? '中文釋義' : '英文單字'}</Text>
                <Text style={[styles.flipHint, flipped && styles.lightText]}>{flipped ? '點擊翻回' : '點擊翻面'}</Text>
              </View>
              {!flipped ? (
                <View style={styles.cardCenter}>
                  <Text style={styles.flashWord}>{card.word}</Text>
                  {card.phonetic ? <Text style={styles.flashPhonetic}>{card.phonetic}</Text> : null}
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.cardCenter}>
                  <Text style={styles.flashDefinition}>{card.definition}</Text>
                  {card.example ? <Text style={styles.flashExample}>“{card.example}”</Text> : null}
                </ScrollView>
              )}
              <Text style={[styles.cardFoot, flipped && styles.lightText]}>{flipped ? `熟悉度 ${card.mastery_level} / 5` : '先在心中想想意思'}</Text>
            </Pressable>
            {flipped ? (
              <View style={styles.reviewActions}>
                <Button label="還不熟" variant="quiet" onPress={() => finishCard(false)} style={styles.reviewButton} />
                <Button label="記住了" onPress={() => finishCard(true)} style={styles.reviewButton} />
              </View>
            ) : <Text style={styles.tapHint}>看過答案後，選擇你對這個單字的熟悉程度。</Text>}
          </View>
        ) : (
          <View style={styles.quizArea}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionType}>{questionMode === 'choice' ? '看英文，選出中文意思' : '看中文，輸入英文單字'}</Text>
            </View>
            <Surface style={styles.questionCard}>
              <Text style={styles.questionPrompt}>{questionMode === 'choice' ? card.word : card.definition}</Text>
              {questionMode === 'choice' && card.phonetic ? <Text style={styles.questionPhonetic}>{card.phonetic}</Text> : null}
              <Text style={styles.questionHint}>{questionMode === 'choice' ? '選出最符合的中文釋義' : `輸入 ${card.word.length} 個字母的單字`}</Text>
            </Surface>

            {questionMode === 'choice' ? (
              <View style={styles.options}>
                {choices.map((choice) => {
                  const correctOption = checked && choice === card.definition;
                  const wrongOption = checked && choice === selectedAnswer && !wasCorrect;
                  return (
                    <Pressable key={choice} disabled={checked} onPress={() => answerQuestion(choice)} style={[styles.option, correctOption && styles.optionCorrect, wrongOption && styles.optionWrong]}>
                      <Text style={[styles.optionText, correctOption && styles.optionCorrectText, wrongOption && styles.optionWrongText]}>{choice}</Text>
                      {correctOption ? <Text style={styles.optionMark}>✓</Text> : null}
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View>
                <TextInput
                  accessibilityLabel="輸入英文單字"
                  value={answer}
                  onChangeText={setAnswer}
                  editable={!checked}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => answerQuestion(answer)}
                  placeholder="輸入英文單字"
                  placeholderTextColor={colors.faint}
                  style={styles.answerInput}
                />
                {!checked ? <Button label="確認答案" onPress={() => answerQuestion(answer)} disabled={!answer.trim()} /> : null}
              </View>
            )}

            {checked ? (
              <View style={[styles.feedback, wasCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <View style={styles.feedbackCopy}>
                  <Text style={[styles.feedbackTitle, wasCorrect ? styles.feedbackTitleCorrect : styles.feedbackTitleWrong]}>{wasCorrect ? '答對了！' : '再記一次就好'}</Text>
                  {!wasCorrect ? <Text style={styles.feedbackAnswer}>正確答案：{card.word} · {card.definition}</Text> : null}
                </View>
                <Button label={index === cards.length - 1 ? '看結果' : '下一題'} onPress={advance} style={styles.nextButton} />
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 19, paddingTop: 10, paddingBottom: 16 },
  topBar: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  exit: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  topTitle: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  deckName: { maxWidth: '100%', color: colors.ink, fontSize: 14, fontWeight: '800' },
  modeName: { color: colors.muted, fontSize: 11, marginTop: 2 },
  counter: { minWidth: 47, color: colors.ink, fontSize: 14, fontWeight: '800', textAlign: 'right' },
  counterMuted: { color: colors.muted, fontWeight: '600' },
  progressTrack: { height: 7, borderRadius: 99, overflow: 'hidden', backgroundColor: '#E1E6EF', marginTop: 5 },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: colors.blue },
  flashcardArea: { flex: 1, justifyContent: 'center' },
  flashcard: { minHeight: 360, maxHeight: 500, padding: 23, justifyContent: 'space-between', borderRadius: 26, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, shadowColor: '#21345D', shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  flashcardBack: { backgroundColor: colors.blue, borderColor: colors.blue },
  cardMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardMeta: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  flipHint: { color: colors.blue, fontSize: 12, fontWeight: '800' },
  lightText: { color: '#E3E8FF' },
  cardCenter: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 22 },
  flashWord: { color: colors.ink, fontSize: 37, lineHeight: 46, fontWeight: '800', textAlign: 'center' },
  flashPhonetic: { color: colors.muted, fontSize: 16, marginTop: 10 },
  flashDefinition: { color: '#FFFFFF', fontSize: 29, lineHeight: 39, fontWeight: '800', textAlign: 'center' },
  flashExample: { color: '#E8ECFF', fontSize: 15, lineHeight: 23, textAlign: 'center', fontStyle: 'italic', marginTop: 19 },
  cardFoot: { color: colors.faint, fontSize: 12, textAlign: 'center' },
  tapHint: { color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: 16 },
  reviewActions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  reviewButton: { flex: 1 },
  quizArea: { flex: 1, justifyContent: 'center', paddingBottom: 15 },
  questionHeader: { alignItems: 'center', marginBottom: 10 },
  questionType: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  questionCard: { minHeight: 180, justifyContent: 'center', alignItems: 'center', padding: 23, marginBottom: 15, backgroundColor: '#FFFFFF' },
  questionPrompt: { color: colors.ink, fontSize: 29, lineHeight: 39, fontWeight: '800', textAlign: 'center' },
  questionPhonetic: { color: colors.muted, fontSize: 14, marginTop: 7 },
  questionHint: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  options: { gap: 9 },
  option: { minHeight: 53, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, borderRadius: 14, borderWidth: 1, borderBottomWidth: 2, borderColor: colors.border, backgroundColor: '#FFFFFF' },
  optionText: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '700' },
  optionCorrect: { backgroundColor: colors.greenPale, borderColor: '#8BD0AE' },
  optionWrong: { backgroundColor: colors.redPale, borderColor: '#E9A6B0' },
  optionCorrectText: { color: colors.green },
  optionWrongText: { color: colors.red },
  optionMark: { color: colors.green, fontSize: 17, fontWeight: '800' },
  answerInput: { height: 54, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: '#FFFFFF', color: colors.ink, fontSize: 17, marginBottom: 11 },
  feedback: { padding: 13, borderRadius: 15, marginTop: 13 },
  feedbackCorrect: { backgroundColor: colors.greenPale },
  feedbackWrong: { backgroundColor: colors.redPale },
  feedbackCopy: { marginBottom: 10 },
  feedbackTitle: { fontSize: 15, fontWeight: '800' },
  feedbackTitleCorrect: { color: colors.green },
  feedbackTitleWrong: { color: colors.red },
  feedbackAnswer: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: 4 },
  nextButton: { minHeight: 43 },
  emptyWrap: { flex: 1, justifyContent: 'center' },
  resultScreen: { justifyContent: 'center' },
  resultContent: { alignItems: 'center', paddingHorizontal: 25 },
  resultIcon: { width: 74, height: 74, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenPale, marginBottom: 20 },
  resultIconText: { color: colors.green, fontSize: 36, fontWeight: '800' },
  resultEyebrow: { color: colors.green, fontSize: 13, fontWeight: '800' },
  resultTitle: { color: colors.ink, fontSize: 26, lineHeight: 34, fontWeight: '800', textAlign: 'center', marginTop: 7 },
  resultSubtitle: { color: colors.muted, fontSize: 14, marginTop: 7 },
  scoreCard: { width: '100%', alignItems: 'center', marginTop: 27, paddingVertical: 23, backgroundColor: '#FFFFFF' },
  scoreValue: { color: colors.blue, fontSize: 42, fontWeight: '800' },
  scoreLabel: { color: colors.muted, fontSize: 14, marginTop: 5 },
  finishButton: { width: '100%', marginTop: 18 },
});
