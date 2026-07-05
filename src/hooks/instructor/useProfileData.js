import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyProfile, selectMyProfile } from "../../redux/slices/profilesSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";
import { fetchMyQuestions, selectMyQuestions } from "../../redux/slices/questionsSlice";

export const useProfileData = () => {
    const dispatch = useDispatch();
    const profile = useSelector(selectMyProfile);
    const rooms = useSelector(selectMyRooms) || [];
    const quizzes = useSelector(selectMyQuizzes) || [];
    const questions = useSelector(selectMyQuestions) || [];

    useEffect(() => {
        dispatch(fetchMyProfile());
        dispatch(fetchMyRooms());
        dispatch(fetchMyQuizzes());
        dispatch(fetchMyQuestions());
    }, [dispatch]);

    return { profile, rooms, quizzes, questions };
};
export default useProfileData;
