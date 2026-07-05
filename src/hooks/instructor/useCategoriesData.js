import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyCategories, selectCategories } from "../../redux/slices/categoriesSlice";

export const useCategoriesData = () => {
    const dispatch = useDispatch();
    const categories = useSelector(selectCategories);

    useEffect(() => {
        dispatch(fetchMyCategories());
    }, [dispatch]);

    return { categories };
};
export default useCategoriesData;
