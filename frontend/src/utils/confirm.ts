import { Alert, Platform } from "react-native";

// Cross-platform confirmation. Resolves true when the user confirms.
export function confirmAction(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  const {
    title,
    message = "",
    confirmLabel = "Ya",
    cancelLabel = "Batal",
    destructive,
  } = options;

  if (Platform.OS === "web") {
    const text = message ? `${title}\n\n${message}` : title;
    return Promise.resolve(
      typeof window !== "undefined" ? window.confirm(text) : false,
    );
  }

  return new Promise((resolve) => {
    Alert.alert(title, message || undefined, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
}
