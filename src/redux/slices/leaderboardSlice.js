// local
import * as svc from "../../services/leaderboardService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchGlobalLeaderboard = createAsyncThunk(
    "leaderboard/global",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getGlobalLeaderboard(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchMonthlyLeaderboard = createAsyncThunk(
    "leaderboard/monthly",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMonthlyLeaderboard(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchCategoryLeaderboard = createAsyncThunk(
    "leaderboard/category",
    async ({ categoryId, ...p }, { rejectWithValue }) => {
        const { data, error, count } = await svc.getCategoryLeaderboard(
            categoryId,
            p,
        );
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchMyPosition = createAsyncThunk(
    "leaderboard/myPos",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getMyLeaderboardPosition();
        return error ? rejectWithValue(error) : data;
    },
);

const slice = createSlice({
    name: "leaderboard",
    initialState: {
        global: [],
        monthly: [],
        category: [],
        myPosition: null,
        count: 0,
        loading: false,
        error: null,
    },
    reducers: {
        updateEntryLocal: (s, { payload }) => {
            const update = (arr) => {
                const idx = arr.findIndex((i) => i.uid === payload.uid);
                if (idx >= 0) arr[idx] = { ...arr[idx], ...payload };
            };
            update(s.global);
            update(s.monthly);
        },
    },
    extraReducers: (b) => {
        const pending = (s) => {
            s.loading = true;
            s.error = null;
        };
        const rejected = (s, { payload }) => {
            s.loading = false;
            s.error = payload;
        };
        b.addCase(fetchGlobalLeaderboard.pending, pending)
            .addCase(fetchGlobalLeaderboard.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.global = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchGlobalLeaderboard.rejected, rejected)
            .addCase(fetchMonthlyLeaderboard.fulfilled, (s, { payload }) => {
                s.monthly = payload.data ?? [];
            })
            .addCase(fetchCategoryLeaderboard.fulfilled, (s, { payload }) => {
                s.category = payload.data ?? [];
            })
            .addCase(fetchMyPosition.fulfilled, (s, { payload }) => {
                s.myPosition = payload;
            });
    },
});

export const { updateEntryLocal } = slice.actions;
export const selectGlobalLeaderboard = (s) => s.leaderboard.global;
export const selectMonthlyLeaderboard = (s) => s.leaderboard.monthly;
export const selectCategoryLeaderboard = (s) => s.leaderboard.category;
export const selectMyPosition = (s) => s.leaderboard.myPosition;
export default slice.reducer;
