import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyQuizzes, selectMyQuizzes, selectQuizLoading } from "../../redux/slices/quizzesSlice";
import { fetchCategories, selectCategories } from "../../redux/slices/categoriesSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";

export const useQuizzesData = () => {
    const dispatch = useDispatch();
    const quizzes = useSelector(selectMyQuizzes);
    const categories = useSelector(selectCategories);
    const rooms = useSelector(selectMyRooms);
    const loading = useSelector(selectQuizLoading);

    useEffect(() => {
        dispatch(fetchMyQuizzes());
        dispatch(fetchCategories());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    return { quizzes, categories, rooms, loading };
};
export default useQuizzesData;
