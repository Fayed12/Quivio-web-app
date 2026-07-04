// local
import * as svc from "../../services/categoriesService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchCategories = createAsyncThunk(
    "categories/fetchAll",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getCategories();
        return error ? rejectWithValue(error) : data;
    },
);


export const fetchMyCategories = createAsyncThunk(
    "categories/fetchMine",
    async (_, { rejectWithValue }) => {
        const { data, error } = await svc.getMyCategories();
        return error ? rejectWithValue(error) : data;
    },
);


export const createCategoryThunk = createAsyncThunk(
    "categories/create",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.createCategory(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const updateCategoryThunk = createAsyncThunk(
    "categories/update",
    async (p, { rejectWithValue }) => {
        const { data, error } = await svc.updateCategory(p);
        return error ? rejectWithValue(error) : data;
    },
);


export const toggleCategoryThunk = createAsyncThunk(
    "categories/toggle",
    async ({ id, isActive }, { rejectWithValue }) => {
        const { data, error } = await svc.toggleCategoryActive(id, isActive);
        return error ? rejectWithValue(error) : data;
    },
);


export const deleteCategoryThunk = createAsyncThunk(
    "categories/delete",
    async (id, { rejectWithValue }) => {
        const { error } = await svc.deleteCategory(id);
        return error ? rejectWithValue(error) : id;
    },
);

const slice = createSlice({
    name: "categories",
    initialState: { items: [], loading: false, error: null },
    reducers: {
        clearCategoryError: (s) => {
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

        b.addCase(fetchCategories.pending, pending)
            .addCase(fetchCategories.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload ?? [];
            })
            .addCase(fetchCategories.rejected, rejected)
            .addCase(fetchMyCategories.fulfilled, (s, { payload }) => {
                s.items = payload ?? [];
            })
            .addCase(createCategoryThunk.pending, pending)
            .addCase(createCategoryThunk.fulfilled, upsert)
            .addCase(createCategoryThunk.rejected, rejected)
            .addCase(updateCategoryThunk.pending, pending)
            .addCase(updateCategoryThunk.fulfilled, upsert)
            .addCase(updateCategoryThunk.rejected, rejected)
            .addCase(toggleCategoryThunk.fulfilled, upsert)
            .addCase(deleteCategoryThunk.fulfilled, (s, { payload }) => {
                s.items = s.items.filter((i) => i.id !== payload);
            });
    },
});

export const { clearCategoryError } = slice.actions;
export const selectCategories = (s) => s.categories.items;
export const selectCategoryById = (id) => (s) =>
    s.categories.items.find((c) => c.id === id);
export default slice.reducer;
