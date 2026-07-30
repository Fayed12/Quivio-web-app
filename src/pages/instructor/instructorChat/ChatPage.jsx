// components
import ChatLayout from "../../../components/chat/ChatLayout";

// styling
import styles from "./ChatPage.module.css";

export default function InstructorChatPage() {
  return (
    <div className={styles.pageContainer}>
      <ChatLayout role="instructor" />
    </div>
  );
}
