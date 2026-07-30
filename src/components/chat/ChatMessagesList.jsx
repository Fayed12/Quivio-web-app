// react
import React, { useEffect, useRef } from "react";

// gsap
import { gsap } from "gsap";

// libraries
import dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import { FiCheck, FiCheckCircle, FiMessageSquare, FiTrash2 } from "react-icons/fi";

// styling
import styles from "./ChatMessagesList.module.css";

dayjs.extend(isToday);
dayjs.extend(isYesterday);

export default function ChatMessagesList({
  messages = [],
  currentUid,
  hasMore = false,
  onLoadMore,
  onDeleteMessage,
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  // Smooth scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // GSAP animation for new message bubbles pop-in
  useEffect(() => {
    if (!containerRef.current) return;
    const bubbles = containerRef.current.querySelectorAll(`.${styles.messageRow}`);
    if (bubbles.length > 0) {
      const lastBubble = bubbles[bubbles.length - 1];
      gsap.fromTo(
        lastBubble,
        { opacity: 0, y: 12, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(1.4)" }
      );
    }
  }, [messages.length]);

  const formatDateHeader = (isoString) => {
    if (!isoString) return "";
    const date = dayjs(isoString);
    if (date.isToday()) return "Today";
    if (date.isYesterday()) return "Yesterday";
    return date.format("MMMM D, YYYY");
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return "";
    return dayjs(isoString).format("h:mm A");
  };

  // Group messages by calendar day for timeline dividers
  const groupedMessages = messages.reduce((groups, msg) => {
    const dayKey = dayjs(msg.created_at).format("YYYY-MM-DD");
    if (!groups[dayKey]) groups[dayKey] = [];
    groups[dayKey].push(msg);
    return groups;
  }, {});

  return (
    <div className={styles.messagesContainer} ref={containerRef}>
      {hasMore && (
        <div className={styles.loadMoreWrapper}>
          <button className={styles.loadMoreBtn} onClick={onLoadMore}>
            Load older messages
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className={styles.emptyState}>
          <FiMessageSquare size={40} style={{ color: "var(--blue-500, #3B82F6)" }} />
          <h3>No messages yet</h3>
          <p>Send a message below to start the conversation!</p>
        </div>
      ) : (
        Object.entries(groupedMessages).map(([dayKey, dayMsgs]) => (
          <React.Fragment key={dayKey}>
            {/* Calendar Date Divider Header */}
            <div className={styles.dateDivider}>
              <span className={styles.dateDividerText}>
                {formatDateHeader(dayMsgs[0]?.created_at)}
              </span>
            </div>

            {/* Messages for this date */}
            {dayMsgs.map((m) => {
              const isMine = m.sender_uid === currentUid;
              const isRead = !!m.read_at;

              return (
                <div
                  key={m.id || m.created_at}
                  className={`${styles.messageRow} ${
                    isMine ? styles.mineRow : styles.theirsRow
                  }`}
                >
                  <div
                    className={`${styles.bubble} ${
                      isMine ? styles.mineBubble : styles.theirsBubble
                    }`}
                  >
                    {m.content}
                  </div>

                  <div className={styles.metaRow}>
                    <span>{formatMessageTime(m.created_at)}</span>
                    {isMine && (
                      <>
                        <span
                          className={`${styles.readReceiptIcon} ${
                            isRead ? styles.readReceiptIconRead : ""
                          }`}
                          title={isRead ? "Read" : "Sent"}
                        >
                          {isRead ? <FiCheckCircle size={12} /> : <FiCheck size={12} />}
                        </span>

                        {onDeleteMessage && (
                          <button
                            type="button"
                            className={styles.deleteMsgBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteMessage(m.id);
                            }}
                            title="Delete message"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
}
