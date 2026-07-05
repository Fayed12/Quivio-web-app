import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
    fetchRoomById, 
    selectCurrentRoom, 
    fetchRoomMembers, 
    selectRoomMembers, 
    fetchNonMembers, 
    selectNonMembers 
} from "../../redux/slices/roomsSlice";
import { fetchMyQuizzes, selectMyQuizzes } from "../../redux/slices/quizzesSlice";

export const useRoomDetailData = (roomId) => {
    const dispatch = useDispatch();
    const room = useSelector(selectCurrentRoom);
    const members = useSelector(selectRoomMembers(roomId));
    const nonMembers = useSelector(selectNonMembers);
    const quizzes = useSelector(selectMyQuizzes);

    useEffect(() => {
        if (roomId) {
            dispatch(fetchRoomById(roomId));
            dispatch(fetchRoomMembers({ roomId }));
            dispatch(fetchNonMembers(roomId));
            dispatch(fetchMyQuizzes());
        }
    }, [dispatch, roomId]);

    const refreshMembers = () => {
        if (roomId) {
            dispatch(fetchRoomMembers({ roomId }));
            dispatch(fetchNonMembers(roomId));
        }
    };

    return { room, members, nonMembers, quizzes, refreshMembers };
};
export default useRoomDetailData;
