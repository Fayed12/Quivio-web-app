// local
import authReducer           from './slices/authSlice';
import profilesReducer       from './slices/profilesSlice';
// import categoriesReducer     from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/categoriesSlice';
// import quizzesReducer        from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/quizzesSlice';
// import questionsReducer      from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/questionsSlice';
// import roomsReducer          from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/roomsSlice';
// import attemptsReducer       from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/attemptsSlice';
// import assignmentsReducer    from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/assignmentsSlice';
// import bookmarksReducer      from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/bookmarksSlice';
// import notificationsReducer  from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/notificationsSlice';
// import achievementsReducer   from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/achievementsSlice';
// import leaderboardReducer    from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/leaderboardSlice';
// import certificatesReducer   from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/certificatesSlice';
// import announcementsReducer  from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/announcementsSlice';
// import instructorStudentsReducer from '../../guide-files/services/quizmaster-pro-src/quizmaster/src/store/slices/instructorStudentsSlice';
import themeReducer from "./slices/themeSLice"


// redux
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    auth:               authReducer,
    profiles:           profilesReducer,
    // categories:         categoriesReducer,
    // quizzes:            quizzesReducer,
    // questions:          questionsReducer,
    // rooms:              roomsReducer,
    // attempts:           attemptsReducer,
    // assignments:        assignmentsReducer,
    // bookmarks:          bookmarksReducer,
    // notifications:      notificationsReducer,
    // achievements:       achievementsReducer,
    // leaderboard:        leaderboardReducer,
    // certificates:       certificatesReducer,
    // announcements:      announcementsReducer,
    // instructorStudents: instructorStudentsReducer,
    theme:              themeReducer,
  },
});

export default store;
