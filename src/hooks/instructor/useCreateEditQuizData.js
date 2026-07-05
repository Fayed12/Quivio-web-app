import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories, selectCategories } from "../../redux/slices/categoriesSlice";
import { fetchMyQuestions, selectMyQuestions } from "../../redux/slices/questionsSlice";
import { fetchQuizById, selectCurrentQuiz } from "../../redux/slices/quizzesSlice";

export const useCreateEditQuizData = (quizId = null) => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);
    const bankQuestions = useSelector(selectMyQuestions);
    const currentQuiz = useSelector(selectCurrentQuiz);

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchMyQuestions());
    }, [dispatch]);

    useEffect(() => {
        if (quizId) {
            dispatch(fetchQuizById(quizId));
        }
    }, [dispatch, quizId]);

    return { categories, bankQuestions, currentQuiz };
};
export default useCreateEditQuizData;
