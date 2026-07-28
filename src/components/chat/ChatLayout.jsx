// react
import React, { useEffect, useRef, useState } from "react";

// redux
import { useDispatch, useSelector } from "react-redux";
import {
  selectActiveConversationId,
  selectConversations,
  selectMessagesForConversation,
  selectHasMoreMessages,
  sendChatMessage,
  markConversationRead,
  loadOlderMessages,
  fetchConversations,
  fetchChatContacts,
} from "../../redux/slices/chatSlice";
import { selectUser } from "../../redux/slices/authSlice";

// realtime hooks
import { useRealtimeChat, useRealtimeChatInbox } from "../../hooks/useRealtimeChat";

// gsap
import { gsap } from "gsap";

// components
import ChatSidebar from "./ChatSidebar";
import ChatTopbar from "./ChatTopbar";
import ChatMessagesList from "./ChatMessagesList";
import ChatInput from "./ChatInput";

// icons
import { FiMessageSquare, FiSend, FiUsers } from "react-icons/fi";

// styling
import styles from "./ChatLayout.module.css";

export default function ChatLayout({ role }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const currentUid = user?.id;

  const conversations = useSelector(selectConversations) || [];
  const activeConversationId = useSelector(selectActiveConversationId);

  const messages = useSelector(
    selectMessagesForConversation(activeConversationId)
  );
  const hasMore = useSelector(selectHasMoreMessages(activeConversationId));

  const [mobileView, setMobileView] = useState("sidebar"); // 'sidebar' | 'chat'
  const containerRef = useRef(null);

  // Initialize Realtime subscriptions
  useRealtimeChatInbox();
  useRealtimeChat(activeConversationId);

  // Fetch initial contacts & conversations list on mount
  useEffect(() => {
    if (currentUid && role) {
      dispatch(fetchChatContacts({ currentUid, role }));
      dispatch(fetchConversations(currentUid));
    }
  }, [dispatch, currentUid, role]);

  // GSAP opening animated entrance for the main chat container
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }
      );
    }
  }, []);

  // Mark conversation read when opened
  useEffect(() => {
    if (activeConversationId && currentUid) {
      dispatch(markConversationRead({ conversationId: activeConversationId, currentUid }));
      setMobileView("chat");
    }
  }, [activeConversationId, currentUid, dispatch]);

  const activeConvo = conversations.find((c) => c.id === activeConversationId);
  const partnerUser = activeConvo?.otherUser;

  const handleSendMessage = (content) => {
    if (!activeConversationId || !currentUid || !content) return;
    dispatch(
      sendChatMessage({
        conversationId: activeConversationId,
        senderUid: currentUid,
        content,
      })
    );
  };

  const handleLoadMore = () => {
    if (!activeConversationId || !messages.length) return;
    dispatch(
      loadOlderMessages({
        conversationId: activeConversationId,
        beforeCreatedAt: messages[0].created_at,
      })
    );
  };

  const handleBackMobile = () => {
    setMobileView("sidebar");
  };

  return (
    <div
      ref={containerRef}
      className={`${styles.chatContainer} ${
        mobileView === "sidebar" ? styles.mobileHideMain : styles.mobileHideSidebar
      }`}
    >
      <div className={styles.sidebarWrapper}>
        <ChatSidebar role={role} />
      </div>

      <main className={styles.mainChatArea}>
        {activeConversationId && partnerUser ? (
          <>
            <ChatTopbar
              partnerUser={partnerUser}
              onBackMobile={handleBackMobile}
            />

            <ChatMessagesList
              messages={messages}
              currentUid={currentUid}
              hasMore={hasMore}
              onLoadMore={handleLoadMore}
            />

            <ChatInput onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div className={styles.noActiveState}>
            <div className={styles.noActiveIconWrapper}>
              <FiMessageSquare size={36} />
            </div>
            <h3 className={styles.noActiveTitle}>Your Direct Messages</h3>
            <p className={styles.noActiveText}>
              Select a conversation from the sidebar or pick a{" "}
              {role === "instructor" ? "student" : "instructor"} from the top search bar to start chatting!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
