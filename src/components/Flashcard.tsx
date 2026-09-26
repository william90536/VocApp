// src/components/Flashcard.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Card } from '../db/queries';

interface FlashcardProps {
  card: Card;
}

export const Flashcard: React.FC<FlashcardProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const spin = useSharedValue(0);
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, 640);

  const handleFlip = () => {
    spin.value = withTiming(isFlipped ? 0 : 1, { duration: 300 });
    setIsFlipped(!isFlipped);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(spin.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(spin.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleFlip}
      style={[styles.touchTarget, { width: cardWidth }]}
    >
      {/* 正面：英文單字 */}
      <Animated.View
        style={[frontAnimatedStyle, styles.card, styles.frontCard, { width: cardWidth }]}
      >
        <View className="flex-row justify-between items-center w-full">
          <Text style={styles.cardMeta}>英文</Text>
          <Text style={styles.flipHint}>點一下查看答案</Text>
        </View>

        <View className="items-center justify-center my-auto">
          <Text style={styles.word}>
            {card.word}
          </Text>
          {card.phonetic ? (
            <Text style={styles.phonetic}>{card.phonetic}</Text>
          ) : null}
        </View>

        <View className="w-full" />
      </Animated.View>

      {/* 背面：中文釋義 */}
      <Animated.View
        style={[backAnimatedStyle, styles.card, styles.backCard, { width: cardWidth }]}
      >
        <View className="flex-row justify-between items-center w-full">
          <Text style={styles.backMeta}>中文釋義</Text>
          <Text style={styles.backHint}>點一下回到單字</Text>
        </View>

        <View className="items-center justify-center my-auto px-2">
          <Text style={styles.definition}>
            {card.definition}
          </Text>
          {card.example ? (
            <View style={styles.exampleBox}>
              <Text style={styles.example}>
                "{card.example}"
              </Text>
            </View>
          ) : null}
        </View>

        <View className="w-full" />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchTarget: { height: 380, alignSelf: 'center' },
  card: { position: 'absolute', height: 380, padding: 24, justifyContent: 'space-between', borderRadius: 12, shadowColor: '#17254a', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 5 },
  frontCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e4e8f1' },
  backCard: { backgroundColor: '#4255ff' },
  word: { color: '#1f2943', fontSize: 36, lineHeight: 44, fontWeight: '800', textAlign: 'center' },
  phonetic: { color: '#68738f', fontSize: 17, lineHeight: 24, fontWeight: '600', textAlign: 'center', marginTop: 12 },
  cardMeta: { color: '#68738f', fontSize: 13, fontWeight: '800' },
  flipHint: { color: '#4255ff', fontSize: 13, fontWeight: '800' },
  backMeta: { color: '#dce2ff', fontSize: 13, fontWeight: '800' },
  backHint: { color: '#fff', fontSize: 13, fontWeight: '800' },
  definition: { color: '#fff', fontSize: 30, lineHeight: 40, fontWeight: '800', textAlign: 'center' },
  exampleBox: { width: '100%', marginTop: 20, padding: 16, borderRadius: 8, backgroundColor: 'rgba(20, 33, 130, 0.24)' },
  example: { color: '#edf0ff', fontSize: 15, lineHeight: 22, fontStyle: 'italic', textAlign: 'center' },
});
