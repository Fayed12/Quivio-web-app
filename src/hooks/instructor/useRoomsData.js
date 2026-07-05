import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyRooms, selectMyRooms, fetchRoomMembers, selectRoomMembers } from "../../redux/slices/roomsSlice";

export const useRoomsData = (roomId = null) => {
    const dispatch = useDispatch();
    const rooms = useSelector(selectMyRooms);
    const roomMembers = useSelector(selectRoomMembers);

    useEffect(() => {
        dispatch(fetchMyRooms());
    }, [dispatch]);

    useEffect(() => {
        if (roomId) {
            dispatch(fetchRoomMembers({ roomId }));
        }
    }, [dispatch, roomId]);

    return { rooms, roomMembers };
};
export default useRoomsData;
