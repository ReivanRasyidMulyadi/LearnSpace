import { Redirect } from "expo-router";

// Root path redirects to the gate; _layout decides where to send the user.
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
