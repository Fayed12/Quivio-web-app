import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyQuestions, selectMyQuestions } from "../../redux/slices/questionsSlice";
import { fetchCategories, selectCategories } from "../../redux/slices/categoriesSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";

export const useQuestionBankData = () => {
    const dispatch = useDispatch();
    const questions = useSelector(selectMyQuestions);
    const categories = useSelector(selectCategories);
    const quizzes = useSelector(selectMyQuizzes);

    useEffect(() => {
        dispatch(fetchMyQuestions());
        dispatch(fetchCategories());
        dispatch(fetchMyQuizzes());
    }, [dispatch]);

    return { questions, categories, quizzes };
};
export default useQuestionBankData;
