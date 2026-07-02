// local
import * as authService from '../../services/authService';
import * as profilesService from '../../services/profilesService';

// redux
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// get current session user and profile from supabase
export const initAuth = createAsyncThunk('auth/init', async (_, { rejectWithValue }) => {
  const { data, error } = await authService.getSession();
  if (error || !data.session) return rejectWithValue(null);

  const { data: profile } = await profilesService.getMyProfile();
  return { session: data.session, user: data.session.user, profile };
});


// login user thunk
export const loginThunk = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  const { data, error } = await authService.login(credentials);
  if (error) return rejectWithValue(error);

  const { data: profile } = await profilesService.getMyProfile();
  return { session: data.session, user: data.user, profile };
});


// register instructor thunk
export const registerInstructorThunk = createAsyncThunk(
  'auth/registerInstructor',
  async (payload, { rejectWithValue }) => {
    const { data, error } = await authService.registerInstructor(payload);
    if (error) return rejectWithValue(error);
    return data;
  }
);


// logout thunk
export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  const { error } = await authService.logout();
  if (error) return rejectWithValue(error);
  return null;
});


// forgot password thunk
export const forgotPasswordThunk = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    const { error } = await authService.forgotPassword(email);
    if (error) return rejectWithValue(error);
    return true;
  }
);


// reset password thunk
export const resetPasswordThunk = createAsyncThunk(
  'auth/resetPassword',
  async (password, { rejectWithValue }) => {
    const { data, error } = await authService.resetPassword(password);
    if (error) return rejectWithValue(error);
    return data;
  }
);

// ── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  user:               null,
  session:            null,
  profile:            null,
  role:               null,   // 'student' | 'instructor' | null
  mustChangePassword: false,
  isAuthenticated:    false,
  loading:            false,
  initializing:       true,   // true until initAuth completes
  error:              null,
  successMessage:     null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // clear error and success messages
    clearError:          (state) => { state.error = null; },
    clearSuccess:        (state) => { state.successMessage = null; },
    
    // set user profile
    setProfile:          (state, { payload }) => { state.profile = payload; },

    // set must change password flag
    setMustChangePassword: (state, { payload }) => { state.mustChangePassword = payload; },

    // sync state from supabase event
    setSession: (state, { payload }) => {
      if (payload) {
        state.session = payload.session;
        state.user = payload.session?.user ?? null;
        state.profile = payload.profile ?? null;
        state.role = payload.profile?.role ?? null;
        state.mustChangePassword = payload.profile?.must_change_password ?? false;
        state.isAuthenticated = !!payload.session;
      } else {
        state.session = null;
        state.user = null;
        state.profile = null;
        state.role = null;
        state.mustChangePassword = false;
        state.isAuthenticated = false;
      }
      state.initializing = false;
    },
  },
  extraReducers: (builder) => {

    // initAuth
    builder
      .addCase(initAuth.pending,  (state) => { state.initializing = true; })
      .addCase(initAuth.fulfilled, (state, { payload }) => {
        state.initializing    = false;
        state.isAuthenticated = true;
        state.session         = payload.session;
        state.user            = payload.user;
        state.profile         = payload.profile;
        state.role            = payload.profile?.role ?? null;
        state.mustChangePassword = payload.profile?.must_change_password ?? false;
      })
      .addCase(initAuth.rejected, (state) => {
        state.initializing    = false;
        state.isAuthenticated = false;
      });

    // login
    builder
      .addCase(loginThunk.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.loading         = false;
        state.isAuthenticated = true;
        state.session         = payload.session;
        state.user            = payload.user;
        state.profile         = payload.profile;
        state.role            = payload.profile?.role ?? null;
        state.mustChangePassword = payload.profile?.must_change_password ?? false;
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // register
    builder
      .addCase(registerInstructorThunk.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(registerInstructorThunk.fulfilled, (state) => {
        state.loading        = false;
        state.successMessage = 'Account created! Please check your email to verify.';
      })
      .addCase(registerInstructorThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // logout
    builder
      .addCase(logoutThunk.fulfilled, () => ({ ...initialState, initializing: false }));

    // forgotPassword
    builder
      .addCase(forgotPasswordThunk.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(forgotPasswordThunk.fulfilled, (state) => {
        state.loading        = false;
        state.successMessage = 'Reset link sent! Check your inbox.';
      })
      .addCase(forgotPasswordThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });

    // resetPassword
    builder
      .addCase(resetPasswordThunk.pending,  (state) => { state.loading = true; state.error = null; })
      .addCase(resetPasswordThunk.fulfilled, (state) => {
        state.loading            = false;
        state.mustChangePassword = false;
        state.successMessage     = 'Password updated successfully.';
      })
      .addCase(resetPasswordThunk.rejected, (state, { payload }) => {
        state.loading = false;
        state.error   = payload;
      });
  },
});

export const { clearError, clearSuccess, setProfile, setMustChangePassword, setSession } = authSlice.actions;

// Selectors
export const selectAuth            = (s) => s.auth;
export const selectUser            = (s) => s.auth.user;
export const selectProfile         = (s) => s.auth.profile;
export const selectRole            = (s) => s.auth.role;
export const selectIsAuthenticated = (s) => s.auth.isAuthenticated;
export const selectIsInitializing  = (s) => s.auth.initializing;
export const selectMustChangePassword = (s) => s.auth.mustChangePassword;

export default authSlice.reducer;
