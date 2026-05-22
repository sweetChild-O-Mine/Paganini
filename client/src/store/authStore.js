import { create } from "zustand";

export const useAuthStore = create((set) => ({
    // 1. initial state- check if they allowed have a wristabnd or not 
    token: localStorage.getItem('paganini_token') || null,

    // 2. action : login
    login: (newToken) => {
        localStorage.setItem('paganini_token', newToken)

        // upadates the global state
        set({ token: newToken })
    },

    // 3. action: Logout 
    logout: () => {
        localStorage.removeItem('paganini_token')

        // wipes out the gloabl state
        set({
            token: null
        })
    }
}))