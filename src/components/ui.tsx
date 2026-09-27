import type { PropsWithChildren } from 'react';
import {
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const colors = {
  canvas: '#F4F6FA',
  surface: '#FFFFFF',
  ink: '#17223B',
  muted: '#65718A',
  faint: '#8B95A8',
  border: '#E1E6EF',
  blue: '#4056E8',
  blueDark: '#2F43C2',
  bluePale: '#E9EDFF',
  green: '#21865A',
  greenPale: '#E2F5EB',
  red: '#B83E50',
  redPale: '#FCE9EC',
  amber: '#9A6511',
  amberPale: '#FFF3D8',
};

export function Screen({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <SafeAreaView edges={['top']} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.pageHeader}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {detail ? <Text style={styles.sectionDetail}>{detail}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}>
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>{label}</Text>
    </Pressable>
  );
}

export function TextField({
  label,
  inputStyle,
  ...props
}: TextInputProps & { label: string; inputStyle?: TextStyle }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.faint}
        style={[styles.input, props.multiline && styles.inputMultiline, inputStyle]}
      />
    </View>
  );
}

export function Surface({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function FormSheet({
  visible,
  title,
  onClose,
  children,
}: PropsWithChildren<{ visible: boolean; title: string; onClose: () => void }>) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={12}>
                <Text style={styles.sheetClose}>關閉</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetBody}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>Aa</Text></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {action ? <Button label={action.label} onPress={action.onPress} style={styles.emptyAction} /> : null}
    </View>
  );
}

export function StatTile({ label, value, tint = 'blue' }: { label: string; value: string | number; tint?: 'blue' | 'green' | 'amber' }) {
  return (
    <View style={styles.statTile}>
      <Text style={[styles.statValue, tint === 'green' && { color: colors.green }, tint === 'amber' && { color: colors.amber }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  pageHeader: { marginBottom: 22 },
  eyebrow: { color: colors.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.4 },
  pageTitle: { color: colors.ink, fontSize: 30, lineHeight: 38, fontWeight: '800', marginTop: 4 },
  pageSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 27, marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  sectionDetail: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  button_primary: { backgroundColor: colors.blue },
  button_secondary: { backgroundColor: colors.bluePale },
  button_quiet: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button_danger: { backgroundColor: colors.redPale },
  buttonText: { fontSize: 15, fontWeight: '800' },
  buttonText_primary: { color: '#FFFFFF' },
  buttonText_secondary: { color: colors.blue },
  buttonText_quiet: { color: colors.ink },
  buttonText_danger: { color: colors.red },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.78 },
  field: { marginBottom: 15 },
  fieldLabel: { color: colors.ink, fontSize: 14, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface, color: colors.ink, fontSize: 16 },
  inputMultiline: { minHeight: 88, paddingTop: 13, textAlignVertical: 'top' },
  surface: { padding: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18 },
  empty: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 34 },
  emptyIcon: { width: 62, height: 62, borderRadius: 19, backgroundColor: colors.bluePale, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyIconText: { color: colors.blue, fontWeight: '800', fontSize: 22 },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7, maxWidth: 300 },
  emptyAction: { marginTop: 17 },
  statTile: { flex: 1, minHeight: 91, padding: 15, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' },
  statValue: { color: colors.blue, fontSize: 25, fontWeight: '800' },
  statLabel: { color: colors.muted, fontSize: 13, fontWeight: '600', marginTop: 4 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(19, 28, 49, 0.45)' },
  sheet: { maxHeight: '88%', backgroundColor: colors.canvas, borderTopLeftRadius: 25, borderTopRightRadius: 25, paddingBottom: 18 },
  sheetHeader: { paddingHorizontal: 22, paddingTop: 11 },
  sheetHandle: { width: 39, height: 4, borderRadius: 5, backgroundColor: '#C9D0DD', alignSelf: 'center', marginBottom: 15 },
  sheetTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sheetTitle: { color: colors.ink, fontSize: 21, fontWeight: '800' },
  sheetClose: { color: colors.blue, fontSize: 14, fontWeight: '800' },
  sheetBody: { paddingHorizontal: 22, paddingBottom: 24 },
});
