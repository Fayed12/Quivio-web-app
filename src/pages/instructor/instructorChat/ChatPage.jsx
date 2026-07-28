// react
import React from "react";

// components
import ChatLayout from "../../../components/chat/ChatLayout";

// styling
import styles from "./ChatPage.module.css";

export default function InstructorChatPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.headerSection}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Classroom Chat & Messages</h1>
          <p className={styles.subtitle}>
            Direct communication hub for all enrolled students across your rooms.
          </p>
        </div>
      </header>

      {/* Shared animated chat layout with instructor role logic */}
      <ChatLayout role="instructor" />
    </div>
  );
}
