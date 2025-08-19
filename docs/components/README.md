# DojoPool Component Documentation

## Core Components

### Mobile Components

#### MobileForm

A touch-optimized form component with built-in validation and various input types.

```typescript
import { MobileForm } from '@components/common/MobileForm';

const fields = [
  {
    name: 'username',
    label: 'Username',
    type: 'text',
    validation: {
      required: true,
      minLength: 3
    }
  }
];

<MobileForm
  fields={fields}
  onSubmit={(values) => console.log(values)}
  submitLabel="Sign Up"
/>
```

Props:

- `fields`: Array of form field configurations
- `onSubmit`: Callback function when form is submitted
- `submitLabel`: Text for submit button
- `isLoading`: Loading state for submit button

#### MobileDatePicker

A touch-friendly date picker with swipe gestures and animations.

```typescript
import { MobileDatePicker } from '@components/common/MobileDatePicker';

<MobileDatePicker
  value={new Date()}
  onChange={(date) => console.log(date)}
  minDate={new Date()}
/>
```

Props:

- `value`: Selected date
- `onChange`: Date change callback
- `minDate`: Minimum selectable date
- `maxDate`: Maximum selectable date

#### MobileTimePicker

A touch-optimized time picker with 12/24 hour format support.

```typescript
import { MobileTimePicker } from '@components/common/MobileTimePicker';

<MobileTimePicker
  value="14:30"
  onChange={(time) => console.log(time)}
  use24Hour={true}
/>
```

Props:

- `value`: Selected time in HH:mm format
- `onChange`: Time change callback
- `use24Hour`: Toggle 24-hour format
- `minuteStep`: Minute increment step

### UI Components

#### DarkModeToggle

A animated dark mode toggle with smooth transitions.

```typescript
import { DarkModeToggle } from '@components/common/DarkModeToggle';

<DarkModeToggle />
```

#### LoadingSkeleton

Customizable loading skeleton for various content types.

```typescript
import { LoadingSkeleton } from '@components/common/LoadingSkeleton';

<LoadingSkeleton
  type="card"
  count={3}
  isLoaded={false}
/>
```

Props:

- `type`: Skeleton layout type ('card', 'list', 'table', 'profile', 'tournament')
- `count`: Number of skeleton items to display
- `isLoaded`: Toggle between skeleton and actual content
- `children`: Content to show when loaded

#### ErrorBoundary

Error boundary component with fallback UI and error details.

```typescript
import { ErrorBoundary } from '@components/common/ErrorBoundary';

<ErrorBoundary
  onError={(error, errorInfo) => console.error(error)}
>
  <YourComponent />
</ErrorBoundary>
```

Props:

- `children`: Components to wrap
- `fallback`: Custom fallback UI
- `onError`: Error handling callback

#### ToastNotification

Customizable toast notifications with animations.

```typescript
import { ToastNotification } from '@components/common/ToastNotification';

<ToastNotification
  status="success"
  title="Success!"
  description="Operation completed successfully"
  onClose={() => {}}
/>
```

Props:

- `status`: Notification type ('success', 'error', 'warning', 'info')
- `title`: Notification title
- `description`: Optional description
- `onClose`: Close callback
- `duration`: Auto-close duration

#### InfiniteScroll

Infinite scroll component with loading and error states.

```typescript
import { InfiniteScroll } from '@components/common/InfiniteScroll';

<InfiniteScroll
  items={items}
  renderItem={(item) => <ItemComponent {...item} />}
  hasMore={true}
  isLoading={false}
  onLoadMore={() => loadMoreItems()}
/>
```

Props:

- `items`: Array of items to render
- `renderItem`: Item render function
- `hasMore`: Whether more items can be loaded
- `isLoading`: Loading state
- `onLoadMore`: Load more callback
- `error`: Error object
- `onRetry`: Retry callback

## Accessibility Features

All components follow WCAG 2.1 guidelines and include:

- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance
- Touch target sizing
- Motion reduction support

## Best Practices

1. Always provide meaningful ARIA labels
2. Ensure proper color contrast
3. Support keyboard navigation
4. Test with screen readers
5. Implement proper focus management
6. Support reduced motion
7. Provide alternative text for images
8. Use semantic HTML elements

## Theme Customization

Components use Chakra UI's theme system. Customize via:

```typescript
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    brand: {
      500: '#0066cc',
    },
  },
});
```

## Error Handling

Components implement error boundaries and provide:

1. Meaningful error messages
2. Fallback UI
3. Recovery options
4. Error logging
5. User feedback

## Performance Considerations

1. Use React.memo for pure components
2. Implement proper memoization
3. Optimize re-renders
4. Lazy load components
5. Use proper key props
6. Optimize images and animations
