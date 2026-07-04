// local
import * as svc from "../../services/quizzesService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchPublishedQuizzes = createAsyncThunk(
    "quizzes/fetchPublished",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getPublishedQuizzes(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchMyQuizzes = createAsyncThunk(
    "quizzes/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyQuizzes(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchQuizById = createAsyncThunk(
    "quizzes/fetchById",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.getQuizById(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const createQuizThunk = createAsyncThunk(
    "quizzes/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createQuiz(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const updateQuizThunk = createAsyncThunk(
    "quizzes/update",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.updateQuiz(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const publishQuizThunk = createAsyncThunk(
    "quizzes/publish",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.publishQuiz(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const unpublishQuizThunk = createAsyncThunk(
    "quizzes/unpublish",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.unpublishQuiz(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const archiveQuizThunk = createAsyncThunk(
    "quizzes/archive",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.archiveQuiz(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const duplicateQuizThunk = createAsyncThunk(
    "quizzes/duplicate",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.duplicateQuiz(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const deleteQuizThunk = createAsyncThunk(
    "quizzes/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteQuiz(id);
        return error ? rejectWithValue(error) : id;
    },
);

const slice = createSlice({
    name: "quizzes",
    initialState: {
        items: [],
        myItems: [],
        current: null,
        count: 0,
        loading: false,
        error: null,
        filters: {
            search: "",
            categoryId: null,
            difficulty: null,
            sortBy: "published_at",
        },
    },
    reducers: {
        clearQuizError: (s) => {
            s.error = null;
        },
        setQuizFilters: (s, { payload }) => {
            s.filters = { ...s.filters, ...payload };
        },
        clearCurrentQuiz: (s) => {
            s.current = null;
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
        const upsertMine = (s, { payload }) => {
            s.loading = false;
            const idx = s.myItems.findIndex((i) => i.id === payload.id);
            idx >= 0 ? (s.myItems[idx] = payload) : s.myItems.unshift(payload);
        };

        b.addCase(fetchPublishedQuizzes.pending, pending)
            .addCase(fetchPublishedQuizzes.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchPublishedQuizzes.rejected, rejected)

            .addCase(fetchMyQuizzes.pending, pending)
            .addCase(fetchMyQuizzes.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.myItems = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyQuizzes.rejected, rejected)

            .addCase(fetchQuizById.pending, pending)
            .addCase(fetchQuizById.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.current = payload;
            })
            .addCase(fetchQuizById.rejected, rejected)

            .addCase(createQuizThunk.pending, pending)
            .addCase(createQuizThunk.fulfilled, upsertMine)
            .addCase(createQuizThunk.rejected, rejected)
            .addCase(updateQuizThunk.pending, pending)
            .addCase(updateQuizThunk.fulfilled, upsertMine)
            .addCase(updateQuizThunk.rejected, rejected)
            .addCase(publishQuizThunk.fulfilled, upsertMine)
            .addCase(unpublishQuizThunk.fulfilled, upsertMine)
            .addCase(archiveQuizThunk.fulfilled, upsertMine)
            .addCase(duplicateQuizThunk.fulfilled, (s, { payload }) => {
                s.myItems.unshift(payload);
            })
            .addCase(deleteQuizThunk.fulfilled, (s, { payload }) => {
                s.myItems = s.myItems.filter((i) => i.id !== payload);
            });
    },
});

export const { clearQuizError, setQuizFilters, clearCurrentQuiz } =
    slice.actions;
export const selectPublishedQuizzes = (s) => s.quizzes.items;
export const selectMyQuizzes = (s) => s.quizzes.myItems;
export const selectCurrentQuiz = (s) => s.quizzes.current;
export const selectQuizFilters = (s) => s.quizzes.filters;
export const selectQuizCount = (s) => s.quizzes.count;
export const selectQuizLoading = (s) => s.quizzes.loading;
export const selectQuizError = (s) => s.quizzes.error;
export default slice.reducer;
