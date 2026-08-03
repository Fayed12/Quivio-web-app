// local
import * as chatService from "../../services/chatService"

// redux
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

/* -----------------------------------------------------------------------
 * Async thunks
 * ---------------------------------------------------------------------*/

export const fetchChatContacts = createAsyncThunk(
  'chat/fetchChatContacts',
  async ({ currentUid, role }, { rejectWithValue }) => {
    try {
      return await chatService.getChatContacts(currentUid, role);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (currentUid, { rejectWithValue }) => {
    try {
      return await chatService.listConversations(currentUid);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const openConversationWith = createAsyncThunk(
  'chat/openConversationWith',
  async ({ currentUid, otherUid }, { getState, rejectWithValue }) => {
    try {
      const conversation = await chatService.getOrCreateConversation(
        currentUid,
        otherUid
      );
      const messages = await chatService.listMessages(conversation.id);

      const state = getState();
      let otherUser = state.chat?.contacts?.find((c) => (c.uid || c.id) === otherUid);

      if (!otherUser) {
        otherUser = await chatService.getProfileByUid(otherUid);
      }

      return { conversation, messages, otherUser, otherUid };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const loadOlderMessages = createAsyncThunk(
  'chat/loadOlderMessages',
  async ({ conversationId, beforeCreatedAt }, { rejectWithValue }) => {
    try {
      const messages = await chatService.listMessages(conversationId, {
        beforeCreatedAt,
      });
      return { conversationId, messages };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const sendChatMessage = createAsyncThunk(
  'chat/sendChatMessage',
  async ({ conversationId, senderUid, content }, { rejectWithValue }) => {
    try {
      return await chatService.sendMessage(conversationId, senderUid, content);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const markConversationRead = createAsyncThunk(
  'chat/markConversationRead',
  async ({ conversationId, currentUid }, { rejectWithValue }) => {
    try {
      await chatService.markConversationRead(conversationId, currentUid);
      return { conversationId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteChatMessage = createAsyncThunk(
  'chat/deleteChatMessage',
  async ({ messageId, currentUid, conversationId }, { rejectWithValue }) => {
    try {
      const result = await chatService.deleteMessage(messageId, currentUid, conversationId);
      return result;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const clearAllMessagesInConversation = createAsyncThunk(
  'chat/clearAllMessagesInConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await chatService.deleteAllConversationMessages(conversationId);
      return { conversationId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await chatService.deleteConversation(conversationId);
      return { conversationId };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnreadCount',
  async (currentUid, { rejectWithValue }) => {
    try {
      return await chatService.getUnreadCount(currentUid);
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/* -----------------------------------------------------------------------
 * Slice
 * ---------------------------------------------------------------------*/

const initialState = {
  contacts: [],
  contactsStatus: 'idle', // idle | loading | succeeded | failed

  conversations: [], // list for the sidebar/inbox screen
  conversationsStatus: 'idle',

  activeConversationId: null,
  messagesByConversation: {}, // { [conversationId]: Message[] }
  hasMoreByConversation: {}, // { [conversationId]: boolean }
  messagesStatus: 'idle',

  sendStatus: 'idle',
  unreadCount: 0,

  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Called by the realtime subscription (see useChat hook) when a new
    // message arrives for the currently open conversation.
    messageReceived(state, action) {
      const message = action.payload;
      const list = state.messagesByConversation[message.conversation_id] || [];
      const existingIndex = list.findIndex((m) => m.id === message.id);

      if (existingIndex !== -1) {
        list[existingIndex] = message;
      } else {
        state.messagesByConversation[message.conversation_id] = [
          ...list,
          message,
        ];
      }

      // Bump conversation preview + reorder to top
      const convo = state.conversations.find((c) => c.id === message.conversation_id);
      const isCurrentlyActive = state.activeConversationId === message.conversation_id;
      const isIncomingFromOther = convo?.otherUser
        ? message.sender_uid === (convo.otherUser.uid || convo.otherUser.id)
        : true;

      if (convo) {
        convo.lastMessage = message.content;
        convo.lastMessageAt = message.created_at;
        if (isCurrentlyActive) {
          convo.unreadCount = 0;
        } else if (isIncomingFromOther) {
          convo.unreadCount = (convo.unreadCount || 0) + 1;
        }
        state.conversations = [
          convo,
          ...state.conversations.filter((c) => c.id !== message.conversation_id),
        ];
      } else {
        const contact = state.contacts.find((c) => (c.uid || c.id) === message.sender_uid);
        state.conversations = [
          {
            id: message.conversation_id,
            lastMessage: message.content,
            lastMessageAt: message.created_at,
            createdAt: message.created_at,
            otherUser: contact || null,
            unreadCount: isCurrentlyActive ? 0 : 1,
          },
          ...state.conversations,
        ];
      }
    },
    messageUpdated(state, action) {
      const message = action.payload;
      const list = state.messagesByConversation[message.conversation_id];
      if (!list) return;
      state.messagesByConversation[message.conversation_id] = list.map((m) =>
        m.id === message.id ? message : m
      );
    },
    messageDeleted(state, action) {
      const { id } = action.payload;

      Object.keys(state.messagesByConversation).forEach((convoId) => {
        const list = state.messagesByConversation[convoId];
        if (list && list.some((m) => m.id === id)) {
          const updatedList = list.filter((m) => m.id !== id);
          state.messagesByConversation[convoId] = updatedList;

          const convo = state.conversations.find((c) => c.id === convoId);
          if (convo) {
            const newest = updatedList.length > 0 ? updatedList[updatedList.length - 1] : null;
            convo.lastMessage = newest ? newest.content : "";
            convo.lastMessageAt = newest ? newest.created_at : convo.lastMessageAt;
          }
        }
      });
    },
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
      const convo = state.conversations.find((c) => c.id === action.payload);
      if (convo) {
        convo.unreadCount = 0;
      }
    },
    clearChatError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Contacts
      .addCase(fetchChatContacts.pending, (state) => {
        state.contactsStatus = 'loading';
      })
      .addCase(fetchChatContacts.fulfilled, (state, action) => {
        state.contactsStatus = 'succeeded';
        state.contacts = action.payload;
      })
      .addCase(fetchChatContacts.rejected, (state, action) => {
        state.contactsStatus = 'failed';
        state.error = action.payload;
      })

      // Conversations list
      .addCase(fetchConversations.pending, (state) => {
        state.conversationsStatus = 'loading';
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversationsStatus = 'succeeded';
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversationsStatus = 'failed';
        state.error = action.payload;
      })

      // Open / create a conversation + initial message page
      .addCase(openConversationWith.pending, (state) => {
        state.messagesStatus = 'loading';
      })
      .addCase(openConversationWith.fulfilled, (state, action) => {
        const { conversation, messages, otherUser, otherUid } = action.payload;
        state.messagesStatus = 'succeeded';
        state.activeConversationId = conversation.id;
        state.messagesByConversation[conversation.id] = messages;
        state.hasMoreByConversation[conversation.id] = messages.length >= 30;

        const existingConvo = state.conversations.find((c) => c.id === conversation.id);
        if (existingConvo) {
          existingConvo.unreadCount = 0;
          if (!existingConvo.otherUser && otherUser) {
            existingConvo.otherUser = otherUser;
          }
        } else {
          const resolvedUser =
            otherUser ||
            state.contacts.find((c) => (c.uid || c.id) === otherUid) ||
            null;
          state.conversations = [
            {
              id: conversation.id,
              lastMessage: conversation.last_message,
              lastMessageAt: conversation.last_message_at,
              createdAt: conversation.created_at,
              otherUser: resolvedUser,
              unreadCount: 0,
            },
            ...state.conversations,
          ];
        }
      })
      .addCase(openConversationWith.rejected, (state, action) => {
        state.messagesStatus = 'failed';
        state.error = action.payload;
      })

      // Pagination (older messages)
      .addCase(loadOlderMessages.fulfilled, (state, action) => {
        const { conversationId, messages } = action.payload;
        const existing = state.messagesByConversation[conversationId] || [];
        state.messagesByConversation[conversationId] = [...messages, ...existing];
        state.hasMoreByConversation[conversationId] = messages.length >= 30;
      })

      // Sending
      .addCase(sendChatMessage.pending, (state) => {
        state.sendStatus = 'loading';
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.sendStatus = 'succeeded';
        const message = action.payload;
        const list = state.messagesByConversation[message.conversation_id] || [];
        const alreadyExists = list.some((m) => m.id === message.id);
        if (!alreadyExists) {
          state.messagesByConversation[message.conversation_id] = [...list, message];
        }
        const convo = state.conversations.find((c) => c.id === message.conversation_id);
        if (convo) {
          convo.lastMessage = message.content;
          convo.lastMessageAt = message.created_at;
          convo.unreadCount = 0;
          state.conversations = [
            convo,
            ...state.conversations.filter((c) => c.id !== message.conversation_id),
          ];
        }
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sendStatus = 'failed';
        state.error = action.payload;
      })

      // Mark read
      .addCase(markConversationRead.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        const list = state.messagesByConversation[conversationId];
        if (list) {
          state.messagesByConversation[conversationId] = list.map((m) => ({
            ...m,
            read_at: m.read_at || new Date().toISOString(),
          }));
        }
        const convo = state.conversations.find((c) => c.id === conversationId);
        if (convo) {
          convo.unreadCount = 0;
        }
      })

      // Delete message
      .addCase(deleteChatMessage.fulfilled, (state, action) => {
        const { messageId, conversationId, latestMsg } = action.payload;
        const convoId = conversationId || state.activeConversationId;
        if (!convoId) return;

        if (state.messagesByConversation[convoId]) {
          state.messagesByConversation[convoId] = state.messagesByConversation[convoId].filter(
            (m) => m.id !== messageId
          );
        }

        const convo = state.conversations.find((c) => c.id === convoId);
        if (convo) {
          const remaining = state.messagesByConversation[convoId] || [];
          const newest = latestMsg || (remaining.length > 0 ? remaining[remaining.length - 1] : null);
          convo.lastMessage = newest ? newest.content : "";
          convo.lastMessageAt = newest ? newest.created_at : convo.lastMessageAt;
        }
      })

      // Clear all messages in conversation
      .addCase(clearAllMessagesInConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        state.messagesByConversation[conversationId] = [];
        const convo = state.conversations.find((c) => c.id === conversationId);
        if (convo) {
          convo.lastMessage = "";
        }
      })

      // Delete conversation permanently
      .addCase(deleteConversation.fulfilled, (state, action) => {
        const { conversationId } = action.payload;
        state.conversations = state.conversations.filter((c) => c.id !== conversationId);
        delete state.messagesByConversation[conversationId];
        if (state.activeConversationId === conversationId) {
          state.activeConversationId = null;
        }
      })

      // Unread badge
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const {
  messageReceived,
  messageUpdated,
  messageDeleted,
  setActiveConversation,
  clearChatError,
} = chatSlice.actions;

/* -----------------------------------------------------------------------
 * Selectors
 * ---------------------------------------------------------------------*/

const EMPTY_ARRAY = [];

export const selectConversations = (state) => state.chat?.conversations || EMPTY_ARRAY;
export const selectActiveConversationId = (state) => state.chat?.activeConversationId || null;
export const selectMessagesForConversation = (conversationId) => (state) =>
  (conversationId && state.chat?.messagesByConversation?.[conversationId]) || EMPTY_ARRAY;
export const selectHasMoreMessages = (conversationId) => (state) =>
  Boolean(conversationId && state.chat?.hasMoreByConversation?.[conversationId]);
export const selectChatContacts = (state) => state.chat?.contacts || EMPTY_ARRAY;
export const selectUnreadCount = (state) => state.chat?.unreadCount || 0;
export const selectChatError = (state) => state.chat?.error || null;

export default chatSlice.reducer;
