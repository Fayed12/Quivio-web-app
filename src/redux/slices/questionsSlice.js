// local
import * as svc from "../../services/questionsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyQuestions = createAsyncThunk(
    "questions/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyQuestions(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchQuestionById = createAsyncThunk(
    "questions/fetchById",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.getQuestionById(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchQuestionsByQuiz = createAsyncThunk(
    "questions/fetchByQuiz",
    async (qId, { rejectWithValue }) => {
        const { data, error } = await svc.getQuestionsByQuiz(qId);
        return error ? rejectWithValue(error) : data;
    },
);


export const createQuestionThunk = createAsyncThunk(
    "questions/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createQuestion(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const updateQuestionThunk = createAsyncThunk(
    "questions/update",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.updateQuestion(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const deleteQuestionThunk = createAsyncThunk(
    "questions/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteQuestion(id);
        return error ? rejectWithValue(error) : id;
    },
);


export const duplicateQuestionThunk = createAsyncThunk(
    "questions/duplicate",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.duplicateQuestion(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const addToQuizThunk = createAsyncThunk(
    "questions/addToQuiz",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.addQuestionToQuiz(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const removeFromQuizThunk = createAsyncThunk(
    "questions/removeFromQuiz",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.removeQuestionFromQuiz(id);
        return error ? rejectWithValue(error) : id;
    },
);


export const reorderQuestionsThunk = createAsyncThunk(
    "questions/reorder",
    async (updates, { rejectWithValue }) => {
        const { error } = await svc.reorderQuizQuestions(updates);
        return error ? rejectWithValue(error) : updates;
    },
);

const slice = createSlice({
    name: "questions",
    initialState: {
        items: [],
        quizQuestions: [],
        current: null,
        count: 0,
        loading: false,
        error: null,
    },
    reducers: {
        clearQuestionError: (s) => {
            s.error = null;
        },
        setCurrentQuestion: (s, { payload }) => {
            s.current = payload;
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

        b.addCase(fetchMyQuestions.pending, pending)
            .addCase(fetchMyQuestions.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyQuestions.rejected, rejected)

            .addCase(fetchQuestionById.fulfilled, (s, { payload }) => {
                s.current = payload;
            })
            .addCase(fetchQuestionsByQuiz.fulfilled, (s, { payload }) => {
                s.quizQuestions = payload ?? [];
            })

            .addCase(createQuestionThunk.pending, pending)
            .addCase(createQuestionThunk.fulfilled, upsert)
            .addCase(createQuestionThunk.rejected, rejected)
            .addCase(updateQuestionThunk.pending, pending)
            .addCase(updateQuestionThunk.fulfilled, upsert)
            .addCase(updateQuestionThunk.rejected, rejected)
            .addCase(deleteQuestionThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.id !== payload);
            })
            .addCase(duplicateQuestionThunk.fulfilled, (s, { payload }) => {
                s.items.unshift(payload);
            })
            .addCase(reorderQuestionsThunk.fulfilled, (s, { payload }) => {
                payload.forEach(({ id, display_order }) => {
                    const q = s.quizQuestions.find((q) => q.id === id);
                    if (q) q.display_order = display_order;
                });
                s.quizQuestions.sort(
                    (a, b) => a.display_order - b.display_order,
                );
            });
    },
});

export const { clearQuestionError, setCurrentQuestion } = slice.actions;
export const selectMyQuestions = (s) => s.questions.items;
export const selectQuizQuestions = (s) => s.questions.quizQuestions;
export const selectCurrentQuestion = (s) => s.questions.current;
export default slice.reducer;
