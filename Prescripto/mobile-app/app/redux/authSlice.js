import { createSlice } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Function to load user from AsyncStorage
const loadUserFromStorage = async () => {
  try {
    const userInfo = await AsyncStorage.getItem("userInfo");
    console.log("Loaded user from storage:", userInfo);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error("Failed to load user info", error);
    return null;
  }
};

const initialState = {
  user: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginAction: (state, action) => {
      console.log("Login action payload:", action.payload);
      state.user = action.payload;
      state.loading = false;
      AsyncStorage.setItem("userInfo", JSON.stringify(action.payload))
        .then(() => console.log("User info saved to storage"))
        .catch(error => console.error("Failed to save user info:", error));
    },
    logoutAction: (state) => {
      state.user = null;
      state.loading = false;
      AsyncStorage.removeItem("userInfo")
        .then(() => console.log("User info removed from storage"))
        .catch(error => console.error("Failed to remove user info:", error));
    },
    setUser: (state, action) => {
      console.log("Setting user in state:", action.payload);
      state.user = action.payload;
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { loginAction, logoutAction, setUser, setLoading } =
  authSlice.actions;

export default authSlice.reducer;

// Thunk to load user from AsyncStorage when the app starts
export const loadUser = () => async (dispatch) => {
  console.log("Loading user from storage...");
  const user = await loadUserFromStorage();
  console.log("Loaded user:", user);
  if (user) {
    dispatch(setUser(user));
  } else {
    dispatch(setLoading(false));
  }
};