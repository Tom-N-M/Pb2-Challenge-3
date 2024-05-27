import { supabase as sb } from "./supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

class AuthService {
  constructor(supabase) {
    this.supabase = supabase
    this.user = null;
    this.loadUser();

    // AppState.addEventListener("change", (this.handleAppStateChange))
  }

  // handleAppStateChange = (state) => {
  //   if (state === "active") {
  //     this.supabase.auth.startAutoRefresh();
  //     this.update();
  //   } else {
  //     this.supabase.auth.stopAutoRefresh();
  //   }
  // }

  async loadUser() {
    try {
      const userJson = await SecureStore.getItemAsync('user');
      if (userJson) {
        console.log("Found User: ", userJson)
        this.user = JSON.parse(userJson);
      } else {
        console.log("No User Signed in")
      }
    } catch (error) {
      console.error('Failed to load user from SecureStore:', error);
    }
  }

  async saveUser(user) {
    try {
      await SecureStore.setItemAsync('user', JSON.stringify(user));
    } catch (error) {
      console.error('Failed to save user to SecureStore:', error);
    }
  }

  async removeUser() {
    try {
      await SecureStore.deleteItemAsync('user');
      this.user = null;
    } catch (error) {
      console.error('Failed to remove user from AsyncStorage/SecureStore: ', error);
    }
  }

  getUser() {
    return this.user;
  }

  async signIn(email, password, rememberMe) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.info("User signed in:", data.user)
      console.info("User.id:", data.user.id)
      // SaveUser Saves to SecureStore if User wants so
      if (rememberMe) {
        await this.saveUser(data.user)
      }
      this.user = data.user;
      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      console.info("User signed out")
      await this.removeUser();
      return this.user;
    } catch (error) {
      throw error;
    };
  }

  async signUp(username, email, password, confirmPassword) {
    if (password !== confirmPassword) {
      throw Error('Passwords do not match')
    }
    try {
      // async func to check if a specific Value is in users table 
      // will not check for Auth Users
      const checkUnique = async (field, value) => {
        let { data, error } = await this.supabase
          .from("users")
          .select("user_id")
          .eq(field, value);
        if (error) throw error;
        if (data && data.length > 0) {
          throw new Error(`${field.capitalize()} is already taken`)
        }
      };
      await checkUnique("username", username);
      await checkUnique("email", email);
      // The main signUp:
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      // Check if Data is there before proceeding
      if (data != null && data.user != null) {
        // Update User info table:
        await this.supabase
          .from('users')
          .insert([{
            user_id: data.user.id, 
            email: email, 
            username: username
          }]);
        // Only local Save, user needs to login again on next app open
        this.user = data.user;
        return data.user;
      } else {
        // this line should theoretically never be executed as there should be a suapabase error if there is no user data
        throw new Error("Something went wrong, data retrieved: ", data);
      }
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthService(sb);