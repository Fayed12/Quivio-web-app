// local
import * as svc from "../../services/profilesService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// get my profile thunk
export const fetchMyProfile = createAsyncThunk(
    "profiles/fetchMine",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getMyProfile();
        return error ? rejectWithValue(error) : data;
    },
);

// get profile by id thunk
export const fetchProfileById = createAsyncThunk(
    "profiles/fetchById",
    async (uid, { rejectWithValue }) => {
        const { data, error } = await svc.getProfileById(uid);
        return error ? rejectWithValue(error) : data;
    },
);

// update profile thunk
export const updateProfileThunk = createAsyncThunk(
    "profiles/update",
    async (updates, { rejectWithValue }) => {
        const { data, error } = await svc.updateMyProfile(updates);
        return error ? rejectWithValue(error) : data;
    },
);

// update avatar thunk
export const updateAvatarThunk = createAsyncThunk(
    "profiles/avatar",
    async (file, { rejectWithValue }) => {
        const { data, error } = await svc.updateAvatar(file);
        return error ? rejectWithValue(error) : data;
    },
);

// delete avatar thunk
export const deleteAvatarThunk = createAsyncThunk(
    "profiles/avatarDelete",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.deleteAvatar();
        return error ? rejectWithValue(error) : data;
    },
);

// deactivate student thunk
export const deactivateStudentThunk = createAsyncThunk(
    "profiles/deactivate",
    async (uid, { rejectWithValue }) => {
        const { data, error } = await svc.deactivateStudent(uid);
        return error ? rejectWithValue(error) : data;
    },
);

// reactivate student thunk
export const reactivateStudentThunk = createAsyncThunk(
    "profiles/reactivate",
    async (uid, { rejectWithValue }) => {
        const { data, error } = await svc.reactivateStudent(uid);
        return error ? rejectWithValue(error) : data;
    },
);

// ── Slice ─────────────────────────────────────────────────────────────────────
const slice = createSlice({
    name: "profiles",
    initialState: { myProfile: null, viewed: {}, loading: false, error: null },
    reducers: {
        clearProfileError: (s) => {
            s.error = null;
        },
        updateProfileLocal: (s, { payload }) => {
            if (s.myProfile) s.myProfile = { ...s.myProfile, ...payload };
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

        b.addCase(fetchMyProfile.pending, pending)
            .addCase(fetchMyProfile.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.myProfile = payload;
            })
            .addCase(fetchMyProfile.rejected, rejected)

            .addCase(fetchProfileById.fulfilled, (s, { payload }) => {
                s.viewed[payload.uid] = payload;
            })

            .addCase(updateProfileThunk.pending, pending)
            .addCase(updateProfileThunk.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.myProfile = payload;
            })
            .addCase(updateProfileThunk.rejected, rejected)

            .addCase(updateAvatarThunk.pending, pending)
            .addCase(updateAvatarThunk.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.myProfile = payload;
            })
            .addCase(updateAvatarThunk.rejected, rejected)

            .addCase(deleteAvatarThunk.pending, pending)
            .addCase(deleteAvatarThunk.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.myProfile = payload;
            })
            .addCase(deleteAvatarThunk.rejected, rejected)

            .addCase(deactivateStudentThunk.fulfilled, (s, { payload }) => {
                if (s.viewed[payload.uid])
                    s.viewed[payload.uid].is_active = false;
            })
            .addCase(reactivateStudentThunk.fulfilled, (s, { payload }) => {
                if (s.viewed[payload.uid])
                    s.viewed[payload.uid].is_active = true;
            });
    },
});

// actions
export const { clearProfileError, updateProfileLocal } = slice.actions;

// selectors
export const selectMyProfile = (s) => s.profiles.myProfile;
export const selectViewedProfile = (uid) => (s) => s.profiles.viewed[uid];

export default slice.reducer;
