// local
import * as svc from "../../services/assignmentsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyAssignments = createAsyncThunk(
    "assignments/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyAssignments(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchStudentAssignments = createAsyncThunk(
    "assignments/fetchStudent",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getStudentAssignments(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const createAssignmentThunk = createAsyncThunk(
    "assignments/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createAssignment(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const updateAssignmentThunk = createAsyncThunk(
    "assignments/update",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.updateAssignment(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const deleteAssignmentThunk = createAsyncThunk(
    "assignments/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteAssignment(id);
        return error ? rejectWithValue(error) : id;
    },
);


export const sendReminderThunk = createAsyncThunk(
    "assignments/remind",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.sendReminder(id);
        return error ? rejectWithValue(error) : data;
    },
);

const slice = createSlice({
    name: "assignments",
    initialState: {
        items: [],
        studentItems: [],
        count: 0,
        loading: false,
        error: null,
    },
    reducers: {
        clearAssignmentError: (s) => {
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
        };

        b.addCase(fetchMyAssignments.pending, pending)
            .addCase(fetchMyAssignments.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyAssignments.rejected, rejected)
            .addCase(fetchStudentAssignments.fulfilled, (s, { payload }) => {
                s.studentItems = payload.data ?? [];
            })
            .addCase(createAssignmentThunk.pending, pending)
            .addCase(createAssignmentThunk.fulfilled, upsert)
            .addCase(createAssignmentThunk.rejected, rejected)
            .addCase(updateAssignmentThunk.fulfilled, upsert)
            .addCase(deleteAssignmentThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.id !== payload);
            });
    },
});

export const { clearAssignmentError } = slice.actions;

export const selectMyAssignments = (s) => s.assignments.items;
export const selectStudentAssignments = (s) => s.assignments.studentItems;

export default slice.reducer;
