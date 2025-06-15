import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./services/queryClient";
import AppWrapper from "./redux/AppWrapper";
import { Provider } from "react-redux";
import store from "./redux/store";
import { SocketContextProvider } from "./context/SocketContext";
export default function RootLayout() {
  return (
    <Provider store={store}>
      <SocketContextProvider>
        <QueryClientProvider client={queryClient}>
          <AppWrapper />
        </QueryClientProvider>
      </SocketContextProvider>
    </Provider>
  );
}
