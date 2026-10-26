// Common screen scaffold: fills the viewport, pads safe-area edges that the
// navigator doesn't already handle (follow TAB_NAVIGATION_AND_SAFE_AREA_INSETS).
// Pass `scroll` to wrap content in a ScrollView.

import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, spacing } from "@/src/theme";

export interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  padHorizontal?: boolean;
  padTopInset?: boolean;
  padBottomInset?: boolean;
  contentContainerStyle?: ViewStyle;
  keyboardAvoiding?: boolean;
  refreshControl?: React.ReactElement;
  testID?: string;
}

const useStyles = makeStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1 },
}));

export function ScreenContainer({
  children,
  scroll,
  padHorizontal = true,
  padTopInset = true,
  padBottomInset = true,
  contentContainerStyle,
  keyboardAvoiding,
  refreshControl,
  testID,
}: ScreenContainerProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  const padding: ViewStyle = {
    paddingTop: padTopInset ? insets.top : 0,
    paddingBottom: padBottomInset ? insets.bottom : 0,
    paddingHorizontal: padHorizontal ? spacing.lg : 0,
  };

  const inner = scroll ? (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, padding, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
      testID={testID}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.root, padding, contentContainerStyle]} testID={testID}>
      {children}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {inner}
      </KeyboardAvoidingView>
    );
  }
  return inner;
}
