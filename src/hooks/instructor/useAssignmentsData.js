import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAssignments, selectMyAssignments } from "../../redux/slices/assignmentsSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";

export const useAssignmentsData = () => {
    const dispatch = useDispatch();
    const assignments = useSelector(selectMyAssignments);
    const quizzes = useSelector(selectMyQuizzes);
    const rooms = useSelector(selectMyRooms);

    useEffect(() => {
        dispatch(fetchMyAssignments());
        dispatch(fetchMyQuizzes());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    return { assignments, quizzes, rooms };
};
export default useAssignmentsData;
