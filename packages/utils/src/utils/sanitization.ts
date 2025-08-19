import { escape } from 'html-escaper';
import validator from 'validator';

interface UserData {
  name?: string | null;
  email?: string | null;
  bio?: string | null;
  [key: string]: unknown;
}

interface GameData {
  title?: string | null;
  description?: string | null;
  notes?: string | null;
  [key: string]: unknown;
}

export function sanitizeUserData(data: UserData): UserData {
  const sanitized: UserData = {};

  // Handle null/undefined values
  if (data.name === null || data.name === undefined) {
    sanitized.name = data.name;
  } else {
    sanitized.name = escape(data.name.toString())
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  }

  if (data.email === null || data.email === undefined) {
    sanitized.email = data.email;
  } else {
    sanitized.email = validator
      .escape(data.email.toString())
      .replace(/['"]/g, '') // Remove quotes
      .toLowerCase()
      .trim();
  }

  if (data.bio === null || data.bio === undefined) {
    sanitized.bio = data.bio;
  } else {
    sanitized.bio = escape(data.bio.toString())
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .trim();
  }

  // Copy other properties that don't need sanitization
  Object.keys(data).forEach((key) => {
    if (!['name', 'email', 'bio'].includes(key)) {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
}

export function sanitizeGameData(data: GameData): GameData {
  const sanitized: GameData = {};

  // Handle null/undefined values
  if (data.title === null || data.title === undefined) {
    sanitized.title = data.title;
  } else {
    sanitized.title = escape(data.title.toString())
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/onerror/gi, '') // Remove onerror attributes
      .trim();
  }

  if (data.description === null || data.description === undefined) {
    sanitized.description = data.description;
  } else {
    sanitized.description = escape(data.description.toString())
      .replace(/'/g, '') // Remove single quotes
      .replace(/--/g, '') // Remove SQL comments
      .trim();
  }

  if (data.notes === null || data.notes === undefined) {
    sanitized.notes = data.notes;
  } else {
    sanitized.notes = escape(data.notes.toString())
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comments
      .trim();
  }

  // Copy other properties that don't need sanitization
  Object.keys(data).forEach((key) => {
    if (!['title', 'description', 'notes'].includes(key)) {
      sanitized[key] = data[key];
    }
  });

  return sanitized;
}
