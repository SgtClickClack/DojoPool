import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { logger } from "./utils/logger";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import helmet from "helmet";

const app = express();
const port = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

app.use(limiter);

// Input validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "../public")));

// Serve the React app for all other routes
app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Basic routes for testing
app.get("/", (req: Request, res: Response) => {
  res.send("DojoPool Platform");
});

// Auth endpoint with validation
app.post(
  "/api/auth/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    validateRequest,
  ],
  (req: Request, res: Response) => {
    res.json({ message: "Auth endpoint" });
  },
);

// Users endpoint with validation
app.get("/api/users", (req: Request, res: Response) => {
  res.json({ message: "Users endpoint" });
});

app.post(
  "/api/users",
  [
    body("username").isLength({ min: 3 }).trim().escape(),
    body("email").isEmail().normalizeEmail(),
    validateRequest,
  ],
  (req: Request, res: Response) => {
    res.json({ message: "User created" });
  },
);

// Games endpoint with validation
app.get("/api/games", (req: Request, res: Response) => {
  res.json({ message: "Games endpoint" });
});

app.post(
  "/api/games",
  [
    body("playerId").isInt(),
    body("gameType").isIn(["8ball", "9ball", "snooker"]),
    validateRequest,
  ],
  (req: Request, res: Response) => {
    res.json({ message: "Game created" });
  },
);

// Tournaments endpoint with validation
app.get("/api/tournaments", (req: Request, res: Response) => {
  res.json({ message: "Tournaments endpoint" });
});

app.post(
  "/api/tournaments",
  [
    body("name").isLength({ min: 3 }).trim().escape(),
    body("type").isIn(["single", "double", "round_robin"]),
    body("startDate").isISO8601(),
    validateRequest,
  ],
  (req: Request, res: Response) => {
    res.json({ message: "Tournament created" });
  },
);

// Analytics endpoint with validation
app.get("/api/analytics", (req: Request, res: Response) => {
  res.json({ message: "Analytics endpoint" });
});

// Settings endpoint with validation
app.get("/api/settings", (req: Request, res: Response) => {
  res.json({ message: "Settings endpoint" });
});

app.post(
  "/api/settings",
  [body("userId").isInt(), body("settings").isObject(), validateRequest],
  (req: Request, res: Response) => {
    res.json({ message: "Settings updated" });
  },
);

// Security headers
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=()");
  next();
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
