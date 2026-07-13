// local
import * as svc from "../../services/certificatesService";

// redux
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchMyCertificates = createAsyncThunk(
    "certs/fetchMine",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getMyCertificates(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchCertsByQuiz = createAsyncThunk(
    "certs/byQuiz",
    async (p, { rejectWithValue }) => {
        const { data, error, count } = await svc.getCertificatesByQuiz(p);
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const fetchInstructorCertificates = createAsyncThunk(
    "certs/fetchInstructorCertificates",
    async (_, { rejectWithValue }) => {
        const { data, error, count } = await svc.getInstructorIssuedCertificates();
        return error ? rejectWithValue(error) : { data, count };
    },
);


export const verifyCertificateThunk = createAsyncThunk(
    "certs/verify",
    async (code, { rejectWithValue }) => {
        const { data, error } = await svc.verifyCertificate(code);
        return error ? rejectWithValue(error) : data;
    },
);

const slice = createSlice({
    name: "certificates",
    initialState: {
        items: [],
        byQuiz: [],
        verified: null,
        count: 0,
        loading: false,
        error: null,
    },
    reducers: {
        clearCertError: (s) => {
            s.error = null;
        },
        clearVerified: (s) => {
            s.verified = null;
        },
        addCertLocal: (s, { payload }) => {
            s.items.unshift(payload);
        },
    },
    extraReducers: (b) => {
        b.addCase(fetchMyCertificates.pending, (s) => {
            s.loading = true;
        })
            .addCase(fetchMyCertificates.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchMyCertificates.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            })
            .addCase(fetchInstructorCertificates.pending, (s) => {
                s.loading = true;
            })
            .addCase(fetchInstructorCertificates.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.items = payload.data ?? [];
                s.count = payload.count;
            })
            .addCase(fetchInstructorCertificates.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
            })
            .addCase(fetchCertsByQuiz.fulfilled, (s, { payload }) => {
                s.byQuiz = payload.data ?? [];
            })
            .addCase(verifyCertificateThunk.pending, (s) => {
                s.loading = true;
                s.verified = null;
            })
            .addCase(verifyCertificateThunk.fulfilled, (s, { payload }) => {
                s.loading = false;
                s.verified = payload;
            })
            .addCase(verifyCertificateThunk.rejected, (s, { payload }) => {
                s.loading = false;
                s.error = payload;
                s.verified = null;
            });
    },
});

export const { clearCertError, clearVerified, addCertLocal } = slice.actions;
export const selectMyCertificates = (s) => s.certificates.items;
export const selectVerifiedCert = (s) => s.certificates.verified;
export default slice.reducer;
