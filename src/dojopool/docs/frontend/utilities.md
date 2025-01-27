# Utilities Documentation

## prompts

**File:** `ai\prompts.ts`

### Exported Functions

- `generateStoryPrompt`
- `validatePrompt`
- `sanitizePrompt`

### Dependencies

```typescript
import { UserProfile } from '../types/user';
```
```typescript
import { TrainingSession } from '../types/training';
```

---

## useABTest

**File:** `frontend\hooks\useABTest.ts`

### Exported Functions

- `useABTest`
- `useABTestMetric`

### Dependencies

```typescript
import { useEffect, useState } from 'react';
```
```typescript
import { useAuth } from '../contexts/AuthContext';
```
```typescript
import { abTestingService } from '../services/abTesting';
```

---

## useNotifications

**File:** `frontend\hooks\useNotifications.ts`

### Exported Functions

- `useNotifications`
- `showError`
- `showSuccess`
- `showWarning`
- `showInfo`

### Exported Types

- `Notification`

### Dependencies

```typescript
import { create } from 'zustand';
```

---

## ai

**File:** `frontend\services\ai.ts`

### Dependencies

```typescript
import api from './api';
```
```typescript
import { generateStoryPrompt, validatePrompt, sanitizePrompt } from '../../ai/prompts';
```
```typescript
import { TrainingSession } from '../../types/training';
```
```typescript
import { UserProfile } from '../../types/user';
```

---

## leaderboard

**File:** `frontend\services\leaderboard.ts`

### Exported Types

- `LeaderboardEntry`
- `LeaderboardFilters`
- `LeaderboardResponse`

### Dependencies

```typescript
import api from './api';
```
```typescript
import { UserProfile } from '../../types/user';
```

---

## notifications

**File:** `frontend\services\notifications.ts`

### Exported Types

- `Notification`
- `NotificationType`
- `NotificationAction`
- `NotificationFilter`

### Dependencies

```typescript
import api from './api';
```
```typescript
import { NotificationPreferences } from '../../types/user';
```

---

## training

**File:** `frontend\services\training.ts`

### Dependencies

```typescript
import api from './api';
```
```typescript
import { TrainingSession, Technique, TrainingFeedback } from '../../types/training';
```

---

## user

**File:** `frontend\services\user.ts`

### Dependencies

```typescript
import api from './api';
```
```typescript
import { UserProfile, UserPreferences, Achievement } from '../../types/user';
```

---

## errorHandling

**File:** `frontend\utils\errorHandling.ts`

### Exported Functions

- `handleApiError`
- `logError`
- `displayUserFriendlyError`
- `isNetworkError`
- `isAuthenticationError`
- `isValidationError`

### Exported Types

- `ApiError`

### Dependencies

```typescript
import { AxiosError } from 'axios';
```

---

## location

**File:** `frontend\utils\location.ts`

### Exported Functions

- `watchLocation`
- `getCurrentLocation`
- `calculateDistance`

### Exported Types

- `Location`

### Dependencies

```typescript
import { LOCATION_OPTIONS } from '../../constants';
```

---

## retryMechanism

**File:** `frontend\utils\retryMechanism.ts`

---

## throttle

**File:** `frontend\utils\throttle.ts`

### Exported Functions

- `throttle`
- `throttleLocationUpdates`

---

## ui

**File:** `static\js\utils\ui.ts`

### Exported Functions

- `debounce`
- `throttle`
- `formatFileSize`
- `isFileSizeValid`
- `formatDate`
- `formatRelativeTime`
- `createElement`
- `showToast`
- `handleInfiniteScroll`
- `downloadFile`
- `getFileExtension`
- `isMobileDevice`
- `getBrowserLanguage`
- `setPageTitle`

### Dependencies

```typescript
import { Config } from '../config';
```

---

## jest.config

**File:** `tests\jest.config.js`

---

## main

**File:** `static\js\main.js`

---

## maps

**File:** `static\js\maps.js`

### Dependencies

```typescript
import VenueInfoWindow from './components/VenueInfoWindow.js';
```

---

## theme

**File:** `static\js\theme.js`

---

## utils

**File:** `static\js\utils.js`

---

## websocket_manager

**File:** `static\js\websocket_manager.js`

---

