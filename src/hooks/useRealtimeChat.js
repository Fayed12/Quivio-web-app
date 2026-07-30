/**
 * @file useRealtimeChat.js
 * Listens for real-time Postgres changes on the messages table using Supabase.
 * Pushes new and updated messages into Redux store and updates unread count badges.
 */

// react
import { useEffect } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import { selectUser } from "../redux/slices/authSlice";
import {
  messageReceived,
  messageUpdated,
  messageDeleted,
  fetchUnreadCount,
  fetchConversations,
  markConversationRead,
} from "../redux/slices/chatSlice";

// local supabase client
import { supabase } from "../services/config/supabaseClient";

/**
 * Hook to subscribe to real-time messages within a single active conversation.
 * @param {string} conversationId - Active conversation UUID
 */
export function useRealtimeChat(conversationId) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const currentUid = user?.id;

  useEffect(() => {
    if (!conversationId || !currentUid) return;

    const channel = supabase
      .channel(`messages:conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        ({ new: message }) => {
          dispatch(messageReceived(message));

          // Automatically mark incoming messages as read if the conversation is currently open
          if (message.sender_uid !== currentUid) {
            dispatch(markConversationRead({ conversationId, currentUid }));
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        ({ new: message }) => {
          dispatch(messageUpdated(message));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        ({ old: message }) => {
          dispatch(messageDeleted({ id: message.id, conversation_id: conversationId }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, currentUid, dispatch]);
}

/**
 * Hook to subscribe to global inbox changes for the current user.
 * Automatically updates unread counts and refreshes conversation list when a message arrives or changes.
 */
export function useRealtimeChatInbox() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user?.id) return;

    // Initial fetch for unread badge count
    dispatch(fetchUnreadCount(user.id));

    const channel = supabase
      .channel(`inbox:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          dispatch(fetchUnreadCount(user.id));
          dispatch(fetchConversations(user.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          dispatch(fetchUnreadCount(user.id));
          dispatch(fetchConversations(user.id));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "messages" },
        () => {
          dispatch(fetchUnreadCount(user.id));
          dispatch(fetchConversations(user.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, dispatch]);
}

export default useRealtimeChat;
