import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./features/cart-slice";
import authReducer from "./features/auth-slice";

// Root action to reset entire store on logout
export const RESET_STORE = "RESET_STORE";

export const makeStore = () => {
  return configureStore({
    reducer: {
      cart: cartReducer,
      auth: authReducer,
    },
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
