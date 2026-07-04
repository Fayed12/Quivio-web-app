// local
import * as svc from "../../services/instructorStudentsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyStudents = createAsyncThunk(
    "iStudents/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyStudents(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchStudentById = createAsyncThunk(
    "iStudents/fetchById",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.getStudentById(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const createStudentThunk = createAsyncThunk(
    "iStudents/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createStudent(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const bulkCreateThunk = createAsyncThunk(
    "iStudents/bulk",
    async (rows, { rejectWithValue }) => {
        const { data, error } = await svc.bulkCreateStudents(rows);
        return error ? rejectWithValue(error) : data;
    },
);


export const resendCredentialsThunk = createAsyncThunk(
    "iStudents/resend",
    async (uid, { rejectWithValue }) => {
        const { data, error } = await svc.resendCredentials(uid);
        return error ? rejectWithValue(error) : { uid, ...data };
    },
);


export const deleteStudentThunk = createAsyncThunk(
    "iStudents/delete",
    async (uid, { rejectWithValue }) => {
        const { error } = await svc.deleteStudent(uid);
        return error ? rejectWithValue(error) : uid;
    },
);

const slice = createSlice({
    name: "instructorStudents",
    initialState: {
        items: [],
        current: null,
        count: 0,
        loading: false,
        error: null,
        bulkResult: null,
    },
    reducers: {
        clearStudentError: (s) => {
            s.error = null;
        },
        clearBulkResult: (s) => {
            s.bulkResult = null;
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

        b.addCase(fetchMyStudents.pending, pending)
            .addCase(fetchMyStudents.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyStudents.rejected, rejected)
            .addCase(fetchStudentById.fulfilled, (s, { payload }) => {
                s.current = payload;
            })
            .addCase(createStudentThunk.pending, pending)
            .addCase(createStudentThunk.fulfilled, (s) => {
                s.loading = false;
            })
            .addCase(createStudentThunk.rejected, rejected)
            .addCase(bulkCreateThunk.pending, pending)
            .addCase(bulkCreateThunk.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.bulkResult = payload;
            })
            .addCase(bulkCreateThunk.rejected, rejected)
            .addCase(resendCredentialsThunk.fulfilled, (s, { payload }) => {
                const item = s.items.find((i) => i.student_uid === payload.uid);
                if (item) item.credentials_resent_at = new Date().toISOString();
            })
            .addCase(deleteStudentThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.student_uid !== payload);
                if (s.current?.student_uid === payload) s.current = null;
            });
    },
});

export const { clearStudentError, clearBulkResult } = slice.actions;
export const selectMyStudents = (s) => s.instructorStudents.items;
export const selectCurrentStudent = (s) => s.instructorStudents.current;
export const selectStudentCount = (s) => s.instructorStudents.count;
export const selectBulkResult = (s) => s.instructorStudents.bulkResult;
export default slice.reducer;
