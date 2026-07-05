// local
import * as svc from "../../services/bookmarksService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyBookmarks = createAsyncThunk(
    "bookmarks/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyBookmarks(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const addBookmarkThunk = createAsyncThunk(
    "bookmarks/add",
    async (quizId, { rejectWithValue }) => {
        const { data, error } = await svc.addBookmark(quizId);
        return error ? rejectWithValue(error) : { data, quizId };
    },
);


export const removeBookmarkThunk = createAsyncThunk(
    "bookmarks/remove",
    async (quizId, { rejectWithValue }) => {
        const { error } = await svc.removeBookmark(quizId);
        return error ? rejectWithValue(error) : quizId;
    },
);


export const toggleBookmarkThunk = createAsyncThunk(
    "bookmarks/toggle",
    async (quizId, { rejectWithValue }) => {
        const { error } = await svc.toggleBookmark(quizId);
        return error ? rejectWithValue(error) : quizId;
    },
);

const slice = createSlice({
    name: "bookmarks",
    initialState: {
        items: [],
        bookmarkedIds: {},
        count: 0,
        loading: false,
        error: null,
    },
    reducers: {
        clearBookmarkError: (s) => {
            s.error = null;
        },
    },
    extraReducers: (b) => {
        b.addCase(fetchMyBookmarks.pending, (s) => {
            s.loading = true;
        })
            .addCase(fetchMyBookmarks.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
                s.bookmarkedIds = (payload.data ?? []).reduce((acc, curr) => {
                    if (curr.quiz?.id) acc[curr.quiz.id] = true;
                    return acc;
                }, {});
            })
            .addCase(addBookmarkThunk.fulfilled, (s, { payload }) => {
                if (payload.data) {
                    s.items.unshift(payload.data);
                    s.bookmarkedIds[payload.quizId] = true;
                }
            })
            .addCase(removeBookmarkThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((b) => b.quiz?.id !== payload);
                delete s.bookmarkedIds[payload];
            });
    },
});

export const { clearBookmarkError } = slice.actions;
export const selectBookmarks = (s) => s.bookmarks.items;
export const selectIsBookmarked = (quizId) => (s) =>
    !!s.bookmarks.bookmarkedIds[quizId];
export default slice.reducer;
