import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyAnnouncements, selectAnnouncements } from "../../redux/slices/announcementsSlice";
import { fetchMyRooms, selectMyRooms } from "../../redux/slices/roomsSlice";

export const useNotificationsData = () => {
    const dispatch = useDispatch();
    const announcements = useSelector(selectAnnouncements);
    const rooms = useSelector(selectMyRooms);

    useEffect(() => {
        dispatch(fetchMyAnnouncements());
        dispatch(fetchMyRooms());
    }, [dispatch]);

    return { announcements, rooms };
};
export default useNotificationsData;
