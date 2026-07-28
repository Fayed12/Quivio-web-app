// react
import React, { useState, useRef } from "react";

// react-icons
import { FiSend } from "react-icons/fi";

// styling
import styles from "./ChatInput.module.css";

const MAX_CHARS = 2000;

export default function ChatInput({ onSendMessage, disabled = false }) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled || trimmed.length > MAX_CHARS) return;
    onSendMessage(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    // Auto adjust height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className={styles.inputContainer}>
      <div
        className={`${styles.inputRow} ${
          isFocused ? styles.inputRowFocus : ""
        }`}
      >
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder="Type your message here..."
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={1}
          disabled={disabled}
        />

        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={disabled || !text.trim() || isOverLimit}
          title="Send Message"
          aria-label="Send Message"
        >
          <FiSend size={16} />
        </button>
      </div>

      <div className={styles.counterRow}>
        <span
          className={`${styles.charCounter} ${
            isOverLimit ? styles.charWarning : ""
          }`}
        >
          {charCount} / {MAX_CHARS}
        </span>
      </div>
    </div>
  );
}
