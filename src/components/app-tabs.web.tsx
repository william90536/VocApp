import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function AppTabs() {
  return <Tabs><TabSlot style={styles.slot}/><TabList asChild><View style={styles.bar}><View style={styles.inner}><Text style={styles.brand}>詞卡</Text><TabTrigger name="index" href="/" asChild><TabButton>單字本</TabButton></TabTrigger><TabTrigger name="explore" href="/explore" asChild><TabButton>進度</TabButton></TabTrigger><TabTrigger name="settings" href="/settings" asChild><TabButton>設定</TabButton></TabTrigger></View></View></TabList></Tabs>;
}
function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) { return <Pressable {...props} style={[styles.tab, isFocused && styles.active]}><Text style={[styles.tabText, isFocused && styles.activeText]}>{children}</Text></Pressable>; }
const styles = StyleSheet.create({ slot:{height:'100%'},bar:{position:'absolute',top:0,width:'100%',padding:16,alignItems:'center'},inner:{width:'100%',maxWidth:980,minHeight:52,paddingHorizontal:12,flexDirection:'row',alignItems:'center',backgroundColor:'#fff',borderWidth:1,borderColor:'#dfe3ee',borderRadius:8},brand:{color:'#1f2943',fontSize:18,fontWeight:'800',marginRight:'auto',paddingHorizontal:8},tab:{paddingHorizontal:14,paddingVertical:9,borderRadius:6},active:{backgroundColor:'#e9ebff'},tabText:{color:'#66728f',fontSize:14,fontWeight:'800'},activeText:{color:'#4255ff'} });
