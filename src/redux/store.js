// local
import authReducer           from './slices/authSlice';
import profilesReducer       from './slices/profilesSlice';
import categoriesReducer     from './slices/categoriesSlice';
import quizzesReducer        from './slices/quizzesSlice';
import questionsReducer      from './slices/questionsSlice';
import roomsReducer          from './slices/roomsSlice';
import attemptsReducer       from './slices/attemptsSlice';
import assignmentsReducer    from './slices/assignmentsSlice';
import bookmarksReducer      from './slices/bookmarksSlice';
import notificationsReducer  from './slices/notificationsSlice';
import achievementsReducer   from './slices/achievementsSlice';
import leaderboardReducer    from './slices/leaderboardSlice';
import certificatesReducer   from './slices/certificatesSlice';
import announcementsReducer  from './slices/announcementsSlice';
import instructorStudentsReducer from './slices/instructorStudentsSlice';
import chatReducer from "./slices/chatSlice"
import themeReducer from "./slices/themeSLice"


// redux
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    auth:               authReducer,
    profiles:           profilesReducer,
    categories:         categoriesReducer,
    quizzes:            quizzesReducer,
    questions:          questionsReducer,
    rooms:              roomsReducer,
    attempts:           attemptsReducer,
    assignments:        assignmentsReducer,
    bookmarks:          bookmarksReducer,
    notifications:      notificationsReducer,
    achievements:       achievementsReducer,
    leaderboard:        leaderboardReducer,
    certificates:       certificatesReducer,
    announcements:      announcementsReducer,
    instructorStudents: instructorStudentsReducer,
    chat:               chatReducer,
    theme:              themeReducer,
  },
});

export default store;
