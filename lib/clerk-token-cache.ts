import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

type TokenCache = {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => Promise<void> | void;
};

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

export const clerkTokenCache: TokenCache | undefined =
  Platform.OS === "web"
    ? undefined
    : {
        async getToken(key) {
          return SecureStore.getItemAsync(key, secureStoreOptions);
        },
        async saveToken(key, token) {
          await SecureStore.setItemAsync(key, token, secureStoreOptions);
        },
        async clearToken(key) {
          await SecureStore.deleteItemAsync(key, secureStoreOptions);
        },
      };
