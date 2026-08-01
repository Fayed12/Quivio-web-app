// local
import * as todosService from "../../services/todosService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/* -----------------------------------------------------------------------
 * Async thunks
 * ---------------------------------------------------------------------*/

export const fetchTodos = createAsyncThunk(
  "todos/fetchTodos",
  async (userUid, { rejectWithValue }) => {
    try {
      return await todosService.listTodos(userUid);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const addTodo = createAsyncThunk(
  "todos/addTodo",
  async ({ userUid, task }, { rejectWithValue }) => {
    try {
      return await todosService.createTodo(userUid, task);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const editTodo = createAsyncThunk(
  "todos/editTodo",
  async ({ taskId, changes }, { rejectWithValue }) => {
    try {
      return await todosService.updateTodo(taskId, changes);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const toggleTodo = createAsyncThunk(
  "todos/toggleTodo",
  async ({ taskId, isCompleted }, { rejectWithValue }) => {
    try {
      return await todosService.toggleTodoCompleted(taskId, isCompleted);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const removeTodo = createAsyncThunk(
  "todos/removeTodo",
  async (taskId, { rejectWithValue }) => {
    try {
      await todosService.deleteTodo(taskId);
      return taskId;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------------------------------------------
 * Slice
 * ---------------------------------------------------------------------*/

const initialState = {
  items: [], // Task[]
  status: "idle", // idle | loading | succeeded | failed
  error: null,
};

const todosSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    // Realtime hook dispatches these directly
    todoInserted(state, action) {
      const task = action.payload;
      const exists = state.items.some((t) => t.id === task.id);
      if (!exists) state.items.unshift(task);
    },
    todoUpdated(state, action) {
      const task = action.payload;
      const idx = state.items.findIndex((t) => t.id === task.id);
      if (idx !== -1) state.items[idx] = task;
    },
    todoDeleted(state, action) {
      const taskId = action.payload;
      state.items = state.items.filter((t) => t.id !== taskId);
    },
    clearTodosError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTodos.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTodos.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTodos.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(addTodo.fulfilled, (state, action) => {
        const exists = state.items.some((t) => t.id === action.payload.id);
        if (!exists) state.items.unshift(action.payload);
      })
      .addCase(addTodo.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(editTodo.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(editTodo.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(toggleTodo.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(toggleTodo.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(removeTodo.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      })
      .addCase(removeTodo.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { todoInserted, todoUpdated, todoDeleted, clearTodosError } =
  todosSlice.actions;

/* -----------------------------------------------------------------------
 * Selectors
 * ---------------------------------------------------------------------*/

export const selectTodos = (state) => state.todos.items;
export const selectTodosStatus = (state) => state.todos.status;
export const selectTodosError = (state) => state.todos.error;
export const selectPendingTodos = (state) =>
  state.todos.items.filter((t) => !t.isCompleted);
export const selectCompletedTodos = (state) =>
  state.todos.items.filter((t) => t.isCompleted);

export default todosSlice.reducer;
