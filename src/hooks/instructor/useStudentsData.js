import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyStudents, selectMyStudents } from "../../redux/slices/instructorStudentsSlice";

export const useStudentsData = () => {
    const dispatch = useDispatch();
    const students = useSelector(selectMyStudents);
    const loading = useSelector((s) => s.instructorStudents?.loading || false);

    useEffect(() => {
        dispatch(fetchMyStudents());
    }, [dispatch]);

    return { students, loading };
};
export default useStudentsData;
