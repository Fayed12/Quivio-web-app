/**
 * @file useRealtimeCertificates.js
 * Watches certificates for INSERT directed at the current user.
 * Adds to Redux and calls optional onIssued(cert) callback.
 * Usage: useRealtimeCertificates({ onIssued: (c) => showCertModal(c) })
 */

// local
import { supabase } from "../services/config/supabaseClient";
import { selectUser } from "../redux/slices/authSlice";
import { addCertLocal } from "../redux/slices/certificatesSlice";

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";

export function useRealtimeCertificates({ onIssued } = {}) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`certificates:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'certificates',
        filter: `uid=eq.${user.id}`,
      }, ({ new: cert }) => {
        dispatch(addCertLocal(cert));
        if (typeof onIssued === 'function') onIssued(cert);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, dispatch, onIssued]);
}
