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
        setTheme: (state, action) => {
            state.currentTheme = action.payload;
            localStorage.setItem('theme', state.currentTheme);
        },
    },
});

export const { toggleTheme, setTheme } = theme.actions;
export default theme.reducer;

// selectors
export const selectTheme = (state) => state.theme.currentTheme;