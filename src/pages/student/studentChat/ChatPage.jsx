// react
import React from "react";

// components
import ChatLayout from "../../../components/chat/ChatLayout";

// styling
import styles from "./ChatPage.module.css";

export default function StudentChatPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Student Messages</h1>
          <p className={styles.subtitle}>
            Communicate directly with your instructor in real time.
          </p>
        </div>
      </header>

      {/* Shared animated chat layout with student role logic */}
      <ChatLayout role="student" />
    </div>
  );
}
