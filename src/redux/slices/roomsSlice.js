// local
import * as svc from "../../services/roomsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyRooms = createAsyncThunk(
    "rooms/fetchMine",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getMyRooms();
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchStudentRooms = createAsyncThunk(
    "rooms/fetchStudent",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getStudentRooms();
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchRoomById = createAsyncThunk(
    "rooms/fetchById",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.getRoomById(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchRoomMembers = createAsyncThunk(
    "rooms/fetchMembers",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getRoomMembers(p);
        return error
            ? rejectWithValue(error)
            : { data, count, roomId: p.roomId };
    },
);


export const fetchNonMembers = createAsyncThunk(
    "rooms/fetchNonMembers",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.getMembersNotInRoom(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const createRoomThunk = createAsyncThunk(
    "rooms/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createRoom(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const updateRoomThunk = createAsyncThunk(
    "rooms/update",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.updateRoom(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const deleteRoomThunk = createAsyncThunk(
    "rooms/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteRoom(id);
        return error ? rejectWithValue(error) : id;
    },
);


export const addMembersThunk = createAsyncThunk(
    "rooms/addMembers",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.addMembersToRoom(p);
        return error ? rejectWithValue(error) : { data, roomId: p.roomId };
    },
);


export const removeMemberThunk = createAsyncThunk(
    "rooms/removeMember",
    async (p, { rejectWithValue }) => {
        const { error } = await svc.removeMemberFromRoom(p);
        return error ? rejectWithValue(error) : p;
    },
);

const slice = createSlice({
    name: "rooms",
    initialState: {
        items: [],
        current: null,
        members: {},
        nonMembers: [],
        loading: false,
        error: null,
    },
    reducers: {
        clearRoomError: (s) => {
            s.error = null;
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
        const upsert = (s, { payload }) => {
            s.loading = false;
            const idx = s.items.findIndex((i) => i.id === payload.id);
            idx >= 0 ? (s.items[idx] = payload) : s.items.unshift(payload);
            if (s.current?.id === payload.id) s.current = payload;
        };

        b.addCase(fetchMyRooms.pending, pending)
            .addCase(fetchMyRooms.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload ?? [];
            })
            .addCase(fetchMyRooms.rejected, rejected)
            .addCase(fetchStudentRooms.fulfilled, (s, { payload }) => {
                s.items = (payload ?? []).map((r) => r.room);
            })
            .addCase(fetchRoomById.fulfilled, (s, { payload }) => {
                s.current = payload;
            })
            .addCase(fetchRoomMembers.fulfilled, (s, { payload }) => {
                s.members[payload.roomId] = payload.data ?? [];
            })
            .addCase(fetchNonMembers.fulfilled, (s, { payload }) => {
                s.nonMembers = payload ?? [];
            })
            .addCase(createRoomThunk.pending, pending)
            .addCase(createRoomThunk.fulfilled, upsert)
            .addCase(createRoomThunk.rejected, rejected)
            .addCase(updateRoomThunk.pending, pending)
            .addCase(updateRoomThunk.fulfilled, upsert)
            .addCase(updateRoomThunk.rejected, rejected)
            .addCase(deleteRoomThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.id !== payload);
                if (s.current?.id === payload) s.current = null;
            })
            .addCase(addMembersThunk.fulfilled, (s, { payload }) => {
                if (payload.data) {
                    s.members[payload.roomId] = [
                        ...(s.members[payload.roomId] ?? []),
                        ...payload.data,
                    ];
                    const room = s.items.find((r) => r.id === payload.roomId);
                    if (room) room.member_count += payload.data.length;
                }
            })
            .addCase(removeMemberThunk.fulfilled, (s, { payload }) => {
                if (s.members[payload.roomId]) {
                    s.members[payload.roomId] = s.members[
                        payload.roomId
                    ].filter((m) => m.profile?.uid !== payload.studentUid);
                    const room = s.items.find((r) => r.id === payload.roomId);
                    if (room && room.member_count > 0) room.member_count -= 1;
                }
            });
    },
});

export const { clearRoomError } = slice.actions;
export const selectMyRooms = (s) => s.rooms.items;
export const selectCurrentRoom = (s) => s.rooms.current;
export const selectRoomMembers = (roomId) => (s) =>
    s.rooms.members[roomId] ?? [];
export const selectNonMembers = (s) => s.rooms.nonMembers;
export default slice.reducer;
