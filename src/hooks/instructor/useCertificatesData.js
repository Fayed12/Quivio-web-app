import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchInstructorCertificates, selectMyCertificates } from "../../redux/slices/certificatesSlice";

export const useCertificatesData = () => {
    const dispatch = useDispatch();
    const issuedCerts = useSelector(selectMyCertificates);

    useEffect(() => {
        dispatch(fetchInstructorCertificates());
    }, [dispatch]);

    return { issuedCerts };
};
export default useCertificatesData;
