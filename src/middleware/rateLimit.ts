import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// Base rate limiter configuration
const createLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Authentication endpoints rate limiter (5 requests per 15 minutes)
export const authLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  5,
  "Too many authentication attempts. Please try again after 15 minutes.",
);

// API endpoints rate limiter (100 requests per 15 minutes)
export const apiLimiter = createLimiter(
  15 * 60 * 1000, // 15 minutes
  100,
  "Too many API requests. Please try again after 15 minutes.",
);

// File upload rate limiter (10 requests per hour)
export const uploadLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  10,
  "Too many file upload attempts. Please try again after 1 hour.",
);

// WebSocket connection rate limiter (30 connections per 5 minutes)
export const wsLimiter = createLimiter(
  5 * 60 * 1000, // 5 minutes
  30,
  "Too many WebSocket connection attempts. Please try again after 5 minutes.",
);

// Game creation rate limiter (20 games per hour)
export const gameCreationLimiter = createLimiter(
  60 * 60 * 1000, // 1 hour
  20,
  "Too many game creation attempts. Please try again after 1 hour.",
);

// Tournament creation rate limiter (5 tournaments per day)
export const tournamentCreationLimiter = createLimiter(
  24 * 60 * 60 * 1000, // 24 hours
  5,
  "Too many tournament creation attempts. Please try again after 24 hours.",
);
