import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyCertificates, selectMyCertificates } from "../../redux/slices/certificatesSlice";

export const useCertificatesData = () => {
    const dispatch = useDispatch();
    const issuedCerts = useSelector(selectMyCertificates);

    useEffect(() => {
        dispatch(fetchMyCertificates());
    }, [dispatch]);

    return { issuedCerts };
};
export default useCertificatesData;
