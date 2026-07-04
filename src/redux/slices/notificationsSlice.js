// local
import * as svc from "../../services/notificationsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyNotifications = createAsyncThunk(
    "notifications/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyNotifications(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchUnreadCount = createAsyncThunk(
    "notifications/unreadCount",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getUnreadCount();
        return error ? rejectWithValue(error) : data;
    },
);


export const markAsReadThunk = createAsyncThunk(
    "notifications/markRead",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.markAsRead(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const markAllAsReadThunk = createAsyncThunk(
    "notifications/markAll",
    async (_, { rejectWithValue }) => {
        const { error } = await svc.markAllAsRead();
        return error ? rejectWithValue(error) : true;
    },
);


export const deleteNotifThunk = createAsyncThunk(
    "notifications/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteNotification(id);
        return error ? rejectWithValue(error) : id;
    },
);

const slice = createSlice({
    name: "notifications",
    initialState: {
        items: [],
        count: 0,
        unreadCount: 0,
        loading: false,
        error: null,
    },
    reducers: {
        clearNotifError: (s) => {
            s.error = null;
        },
        addNotifLocal: (s, { payload }) => {
            s.items.unshift(payload);
            s.unreadCount += 1;
        },
        incrementUnread: (s) => {
            s.unreadCount += 1;
        },
    },
    extraReducers: (b) => {
        b.addCase(fetchMyNotifications.pending, (s) => {
            s.loading = true;
        })
            .addCase(fetchMyNotifications.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyNotifications.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            })
            .addCase(fetchUnreadCount.fulfilled, (s, { payload }) => {
                s.unreadCount = payload;
            })
            .addCase(markAsReadThunk.fulfilled, (s, { payload }) => {
                const n = s.items.find((i) => i.id === payload.id);
                if (n && !n.read_at) {
                    n.read_at = payload.read_at;
                    s.unreadCount = Math.max(0, s.unreadCount - 1);
                }
            })
            .addCase(markAllAsReadThunk.fulfilled, (s) => {
                s.items.forEach((i) => {
                    if (!i.read_at) i.read_at = new Date().toISOString();
                });
                s.unreadCount = 0;
            })
            .addCase(deleteNotifThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.id !== payload);
            });
    },
});

export const { clearNotifError, addNotifLocal, incrementUnread } =
    slice.actions;
export const selectNotifications = (s) => s.notifications.items;
export const selectUnreadCount = (s) => s.notifications.unreadCount;
export default slice.reducer;
