// src/components/StudySession.tsx
import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Card } from '../db/queries';
import { Flashcard } from './Flashcard';

interface StudySessionProps {
  cards: Card[];
  onFinish: () => void;
}

export const StudySession: React.FC<StudySessionProps> = ({ cards, onFinish }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (cards.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>這個單字本還沒有卡片</Text>
        <Text style={styles.emptyDescription}>先新增幾個單字，再回來開始複習。</Text>
        <TouchableOpacity onPress={onFinish} style={styles.emptyButton}>
          <Text style={styles.emptyButtonText}>返回單字本</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>學習模式</Text>
          <Text style={styles.progressCount}>{currentIndex + 1} / {cards.length}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${((currentIndex + 1) / cards.length) * 100}%` }]}
          />
        </View>
      </View>

      <View style={styles.cardArea}>
        <Flashcard key={currentCard.id} card={currentCard} />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={handlePrev}
          style={[styles.secondaryButton, currentIndex === 0 && styles.buttonDisabled]}
        >
          <Text style={styles.secondaryButtonText}>上一張</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>{currentIndex === cards.length - 1 ? '完成學習' : '知道了'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 8, paddingBottom: 20 },
  progressSection: { paddingHorizontal: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { color: '#586380', fontSize: 14, fontWeight: '700' },
  progressCount: { color: '#1f2943', fontSize: 14, fontWeight: '800' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#dfe3ee', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#4255ff' },
  cardArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 8, paddingTop: 16 },
  primaryButton: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#4255ff', borderBottomWidth: 4, borderBottomColor: '#2e3fcf' },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryButton: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderBottomWidth: 4, borderColor: '#d9deea' },
  secondaryButtonText: { color: '#46516d', fontSize: 16, fontWeight: '800' },
  buttonDisabled: { opacity: 0.42 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: '#1f2943', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { color: '#67728e', fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  emptyButton: { marginTop: 24, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 8, backgroundColor: '#4255ff' },
  emptyButtonText: { color: '#fff', fontWeight: '800' },
});
