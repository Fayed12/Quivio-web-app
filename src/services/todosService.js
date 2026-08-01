// src/services/todosService.js
import { supabase } from "./config/supabaseClient";

/**
 * Maps a DB row (snake_case) to the frontend shape (camelCase) used
 * throughout the app.
 */
export function toClientShape(row) {
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    priority: row.priority,
    dueDate: row.due_date,
    description: row.description,
    isCompleted: row.is_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const mapTodoRow = toClientShape;

/**
 * Lists all todos for the current user, newest first.
 */
export async function listTodos(userUid) {
  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_uid", userUid)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(toClientShape);
}

/**
 * Creates a new todo.
 * `task` matches the shape you're already building in the UI:
 * { title, topic, priority, dueDate, description }
 */
export async function createTodo(userUid, task) {
  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_uid: userUid,
      title: task.title.trim(),
      topic: task.topic?.trim() || "General Practice",
      priority: (task.priority || "medium").toLowerCase(),
      due_date: task.dueDate || null,
      description: task.description?.trim() || null,
      is_completed: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return toClientShape(data);
}

/**
 * Updates a todo's editable fields. Pass only what changed.
 */
export async function updateTodo(taskId, changes) {
  const payload = {};
  if (changes.title !== undefined) payload.title = changes.title.trim();
  if (changes.topic !== undefined) payload.topic = changes.topic.trim();
  if (changes.priority !== undefined) payload.priority = changes.priority.toLowerCase();
  if (changes.dueDate !== undefined) payload.due_date = changes.dueDate || null;
  if (changes.description !== undefined)
    payload.description = changes.description.trim();
  if (changes.isCompleted !== undefined)
    payload.is_completed = changes.isCompleted;

  const { data, error } = await supabase
    .from("todos")
    .update(payload)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return toClientShape(data);
}

/**
 * Toggles the completed state.
 */
export async function toggleTodoCompleted(taskId, isCompleted) {
  return updateTodo(taskId, { isCompleted });
}

/**
 * Deletes a todo.
 */
export async function deleteTodo(taskId) {
  const { error } = await supabase.from("todos").delete().eq("id", taskId);
  if (error) throw error;
  return taskId;
}