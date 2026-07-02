// redux
import { createSlice } from "@reduxjs/toolkit";

const theme = createSlice({
    name: 'theme',
    initialState: {
        currentTheme: localStorage.getItem('theme') || 'light',
    },
    reducers: {
        toggleTheme: (state) => {
            state.currentTheme = state.currentTheme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', state.currentTheme);
        },
    },
});

export const { toggleTheme } = theme.actions;
export default theme.reducer;

// selectors
export const selectTheme = (state) => state.theme.currentTheme;