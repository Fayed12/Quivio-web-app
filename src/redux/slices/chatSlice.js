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
  async ({ currentUid, otherUid }, { rejectWithValue }) => {
    try {
      const conversation = await chatService.getOrCreateConversation(
        currentUid,
        otherUid
      );
      const messages = await chatService.listMessages(conversation.id);
      return { conversation, messages };
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
      const alreadyExists = list.some((m) => m.id === message.id);
      if (!alreadyExists) {
        state.messagesByConversation[message.conversation_id] = [
          ...list,
          message,
        ];
      }

      // Bump conversation preview + reorder to top
      const convo = state.conversations.find((c) => c.id === message.conversation_id);
      if (convo) {
        convo.lastMessage = message.content;
        convo.lastMessageAt = message.created_at;
        state.conversations = [
          convo,
          ...state.conversations.filter((c) => c.id !== message.conversation_id),
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
    setActiveConversation(state, action) {
      state.activeConversationId = action.payload;
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
        const { conversation, messages } = action.payload;
        state.messagesStatus = 'succeeded';
        state.activeConversationId = conversation.id;
        state.messagesByConversation[conversation.id] = messages;
        state.hasMoreByConversation[conversation.id] = messages.length >= 30;

        const exists = state.conversations.some((c) => c.id === conversation.id);
        if (!exists) {
          state.conversations = [
            {
              id: conversation.id,
              lastMessage: conversation.last_message,
              lastMessageAt: conversation.last_message_at,
              createdAt: conversation.created_at,
              otherUser: null, // refresh via fetchConversations if needed
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
  setActiveConversation,
  clearChatError,
} = chatSlice.actions;

/* -----------------------------------------------------------------------
 * Selectors
 * ---------------------------------------------------------------------*/

export const selectConversations = (state) => state.chat.conversations;
export const selectActiveConversationId = (state) => state.chat.activeConversationId;
export const selectMessagesForConversation = (conversationId) => (state) =>
  state.chat.messagesByConversation[conversationId] || [];
export const selectHasMoreMessages = (conversationId) => (state) =>
  !!state.chat.hasMoreByConversation[conversationId];
export const selectChatContacts = (state) => state.chat.contacts;
export const selectUnreadCount = (state) => state.chat.unreadCount;
export const selectChatError = (state) => state.chat.error;

export default chatSlice.reducer;
