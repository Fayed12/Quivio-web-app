// local
import * as svc from "../../services/achievementsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchAllAchievements = createAsyncThunk(
    "achievements/fetchAll",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getAllAchievements();
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchMyAchievements = createAsyncThunk(
    "achievements/fetchMine",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getMyAchievements();
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchStudentAchievements = createAsyncThunk(
    "achievements/fetchStudent",
    async (uid, { rejectWithValue }) => {
        const { data, error } = await svc.getStudentAchievements(uid);
        return error ? rejectWithValue(error) : data;
    },
);

const slice = createSlice({
    name: "achievements",
    initialState: { all: [], earned: [], loading: false, error: null },
    reducers: {
        addEarnedAchievement: (s, { payload }) => {
            if (
                !s.earned.find(
                    (e) => e.achievement_id === payload.achievement_id,
                )
            )
                s.earned.unshift(payload);
        },
    },
    extraReducers: (b) => {
        b.addCase(fetchAllAchievements.fulfilled, (s, { payload }) => {
            s.all = payload ?? [];
        })
            .addCase(fetchMyAchievements.pending, (s) => {
                s.loading = true;
            })
            .addCase(fetchMyAchievements.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.earned = payload ?? [];
            })
            .addCase(fetchMyAchievements.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            });
    },
});

export const { addEarnedAchievement } = slice.actions;

export const selectAllAchievements = (s) => s.achievements.all;
export const selectEarnedAchievements = (s) => s.achievements.earned;
export const selectEarnedIds = (s) =>
    new Set(s.achievements.earned.map((e) => e.achievement_id));

export default slice.reducer;
