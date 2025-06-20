import React, { useEffect } from "react";
import { useDispatch } from "react-redux";

import { Stack } from "expo-router/stack";
import { loadUser } from "./authSlice";

function AppWrapper() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{ title: "Home", headerShown: false }}
      />
      <Stack.Screen 
        name="auth" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="tabs" 
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default AppWrapper;