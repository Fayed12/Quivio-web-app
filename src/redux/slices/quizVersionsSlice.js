// src/redux/slices/quizVersionsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as quizVersionsService from "../../services/quizVersionsService"; // <-- adjust path if needed

/* -----------------------------------------------------------------------
 * Async thunks
 * ---------------------------------------------------------------------*/

export const fetchQuizVersions = createAsyncThunk(
  "quizVersions/fetchQuizVersions",
  async (quizId, { rejectWithValue }) => {
    try {
      const versions = await quizVersionsService.listQuizVersions(quizId);
      return { quizId, versions };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchQuizVersionDetail = createAsyncThunk(
  "quizVersions/fetchQuizVersionDetail",
  async (versionId, { rejectWithValue }) => {
    try {
      return await quizVersionsService.getQuizVersion(versionId);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const saveQuizVersion = createAsyncThunk(
  "quizVersions/saveQuizVersion",
  async ({ quizId, note }, { rejectWithValue }) => {
    try {
      const version = await quizVersionsService.createQuizVersion(quizId, note);
      return { quizId, version };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------------------------------------------
 * Slice
 * ---------------------------------------------------------------------*/

const initialState = {
  versionsByQuiz: {}, // { [quizId]: QuizVersion[] }
  selectedVersion: null,
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const quizVersionsSlice = createSlice({
  name: "quizVersions",
  initialState,
  reducers: {
    // Called by the realtime hook when a new version row is inserted
    // (either the auto-version trigger or a manual save from another tab).
    versionReceived(state, action) {
      const version = action.payload;
      const list = state.versionsByQuiz[version.quiz_id] || [];
      const alreadyExists = list.some((v) => v.id === version.id);
      if (!alreadyExists) {
        state.versionsByQuiz[version.quiz_id] = [version, ...list].sort(
          (a, b) => b.version_number - a.version_number
        );
      }
    },
    clearSelectedVersion(state) {
      state.selectedVersion = null;
    },
    clearQuizVersionsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizVersions.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchQuizVersions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.versionsByQuiz[action.payload.quizId] = action.payload.versions;
      })
      .addCase(fetchQuizVersions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchQuizVersionDetail.fulfilled, (state, action) => {
        state.selectedVersion = action.payload;
      })
      .addCase(fetchQuizVersionDetail.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(saveQuizVersion.fulfilled, (state, action) => {
        const { quizId, version } = action.payload;
        const list = state.versionsByQuiz[quizId] || [];
        const alreadyExists = list.some((v) => v.id === version.id);
        if (!alreadyExists) {
          state.versionsByQuiz[quizId] = [version, ...list];
        }
      })
      .addCase(saveQuizVersion.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { versionReceived, clearSelectedVersion, clearQuizVersionsError } =
  quizVersionsSlice.actions;

/* -----------------------------------------------------------------------
 * Selectors
 * ---------------------------------------------------------------------*/

export const selectQuizVersions = (quizId) => (state) =>
  state.quizVersions.versionsByQuiz[quizId] || [];
export const selectSelectedVersion = (state) => state.quizVersions.selectedVersion;
export const selectQuizVersionsStatus = (state) => state.quizVersions.status;
export const selectQuizVersionsError = (state) => state.quizVersions.error;

export default quizVersionsSlice.reducer;
