// local
import * as svc from "../../services/attemptsService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const startAttemptThunk = createAsyncThunk(
    "attempts/start",
    async (quizId, { rejectWithValue }) => {
        const { data, error } = await svc.startAttempt(quizId);
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchActiveAttempt = createAsyncThunk(
    "attempts/fetchActive",
    async (quizId, { rejectWithValue }) => {
        const { data, error } = await svc.getActiveAttempt(quizId);
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchAttemptById = createAsyncThunk(
    "attempts/fetchById",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.getAttemptById(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchMyAttempts = createAsyncThunk(
    "attempts/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyAttempts(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchAttemptsByQuiz = createAsyncThunk(
    "attempts/fetchByQuiz",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getAttemptsByQuiz(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const saveAnswerThunk = createAsyncThunk(
    "attempts/saveAnswer",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.saveAnswer(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const updateProgressThunk = createAsyncThunk(
    "attempts/updateProgress",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.updateAttemptProgress(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const toggleFlagThunk = createAsyncThunk(
    "attempts/toggleFlag",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.toggleFlagQuestion(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const submitAttemptThunk = createAsyncThunk(
    "attempts/submit",
    async (id, { rejectWithValue }) => {
        const { data, error } = await svc.submitAttempt(id);
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchMyStats = createAsyncThunk(
    "attempts/fetchStats",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getMyStats();
        return error ? rejectWithValue(error) : data;
    },
);

const slice = createSlice({
    name: "attempts",
    initialState: {
        items: [],
        byQuiz: [],
        active: null,
        current: null,
        stats: null,
        count: 0,
        // quiz-taking session state
        answers: {},
        flagged: [],
        currentIndex: 0,
        timeRemaining: null,
        submitting: false,
        loading: false,
        error: null,
    },
    reducers: {
        clearAttemptError: (s) => {
            s.error = null;
        },
        clearActiveAttempt: (s) => {
            s.active = null;
            s.answers = {};
            s.flagged = [];
            s.currentIndex = 0;
        },
        setCurrentIndex: (s, { payload }) => {
            s.currentIndex = payload;
        },
        setTimeRemaining: (s, { payload }) => {
            s.timeRemaining = payload;
        },
        setAnswerLocal: (s, { payload }) => {
            s.answers[payload.question_id] = payload.selected_option_id;
        },
        setFlaggedLocal: (s, { payload }) => {
            s.flagged = payload;
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

        b.addCase(startAttemptThunk.fulfilled, (s, { payload }) => {
            s.active = payload;
            s.timeRemaining = payload.time_remaining_secs;
            s.answers = {};
            s.flagged = [];
        })
            .addCase(fetchActiveAttempt.fulfilled, (s, { payload }) => {
                s.active = payload;
                if (payload) {
                    s.timeRemaining = payload.time_remaining_secs;
                    s.flagged = payload.flagged_questions ?? [];
                    const answerMap = {};
                    (payload.attempt_answers ?? []).forEach((a) => {
                        answerMap[a.question_id] = a.selected_option_id;
                    });
                    s.answers = answerMap;
                }
            })
            .addCase(fetchAttemptById.pending, pending)
            .addCase(fetchAttemptById.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.current = payload;
            })
            .addCase(fetchAttemptById.rejected, rejected)
            .addCase(fetchMyAttempts.pending, pending)
            .addCase(fetchMyAttempts.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyAttempts.rejected, rejected)
            .addCase(fetchAttemptsByQuiz.fulfilled, (s, { payload }) => {
                s.byQuiz = payload.data ?? [];
            })
            .addCase(saveAnswerThunk.fulfilled, (s, { payload }) => {
                s.answers[payload.question_id] = payload.selected_option_id;
            })
            .addCase(toggleFlagThunk.fulfilled, (s, { payload }) => {
                s.flagged = payload.flagged_questions ?? [];
            })
            .addCase(submitAttemptThunk.pending, (s) => {
                s.submitting = true;
                s.error = null;
            })
            .addCase(submitAttemptThunk.fulfilled, (s) => {
                s.submitting = false;
                s.active = null;
            })
            .addCase(submitAttemptThunk.rejected, (s, { payload }) => {
                s.submitting = false;
                s.error = payload;
            })
            .addCase(fetchMyStats.fulfilled, (s, { payload }) => {
                s.stats = payload;
            });
    },
});

export const {
    clearAttemptError,
    clearActiveAttempt,
    setCurrentIndex,
    setTimeRemaining,
    setAnswerLocal,
    setFlaggedLocal,
} = slice.actions;
export const selectActiveAttempt = (s) => s.attempts.active;
export const selectCurrentAttempt = (s) => s.attempts.current;
export const selectMyAttempts = (s) => s.attempts.items;
export const selectAttemptAnswers = (s) => s.attempts.answers;
export const selectFlagged = (s) => s.attempts.flagged;
export const selectCurrentIndex = (s) => s.attempts.currentIndex;
export const selectTimeRemaining = (s) => s.attempts.timeRemaining;
export const selectMyStats = (s) => s.attempts.stats;
export const selectSubmitting = (s) => s.attempts.submitting;
export default slice.reducer;
