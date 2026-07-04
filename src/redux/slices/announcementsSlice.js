// local
import * as svc from "../../services/announcementsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyAnnouncements = createAsyncThunk(
    "announcements/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyAnnouncements(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const createAnnouncementThunk = createAsyncThunk(
    "announcements/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createAnnouncement(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const deleteAnnouncementThunk = createAsyncThunk(
    "announcements/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteAnnouncement(id);
        return error ? rejectWithValue(error) : id;
    },
);

const slice = createSlice({
    name: "announcements",
    initialState: { items: [], count: 0, loading: false, error: null },
    reducers: {
        clearAnnouncementError: (s) => {
            s.error = null;
        },
    },
    extraReducers: (b) => {
        b.addCase(fetchMyAnnouncements.pending, (s) => {
            s.loading = true;
        })
            .addCase(fetchMyAnnouncements.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyAnnouncements.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            })
            .addCase(createAnnouncementThunk.fulfilled, (s, { payload }) => {
                s.items.unshift(payload);
            })
            .addCase(deleteAnnouncementThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.id !== payload);
            });
    },
});

export const { clearAnnouncementError } = slice.actions;

export const selectAnnouncements = (s) => s.announcements.items;

export default slice.reducer;
