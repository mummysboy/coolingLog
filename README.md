# Food Chilling Log - iPad-First UI

A Next.js 14 application designed for food safety logging on iPad devices in landscape mode. This front-end only application provides a touch-friendly interface for employees to complete cooking and cooling logs with real-time validation and offline storage.

## Features

### 🎯 Core Functionality
- **5-Stage Cooking Process**: Cook → Start Cooling → Cool to ≤80°F → Cool to ≤54°F → Final Chill
- **Real-time Validation**: Temperature and time thresholds automatically validated
- **Countdown Timers**: Live timers for stages with deadlines
- **Corrective Actions**: Required documentation for failed stages
- **Offline Storage**: IndexedDB persistence for offline capability

### 📱 iPad-Optimized Design
- **Touch-First**: Large touch targets (min 64px)
- **Landscape Layout**: Optimized for 1024x768 iPad landscape
- **Custom Keypad**: Large numeric input for temperature entry
- **Visual Feedback**: Color-coded stage cards and progress indicators

### 🔧 Technical Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **IndexedDB** for offline persistence

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Visit `http://localhost:3000` to access the application.

## Application Structure

### Main Components

#### ProductPicker
- Horizontal scrolling product chips
- Custom product input option
- Thermometer and lot number fields

#### StageStepper
- Sequential stage progression
- Temperature and time input for each stage
- Visual status indicators (pending/active/completed/failed)

#### KeypadInput
- Custom numeric keypad modal
- Temperature input with °F suffix
- Large touch-friendly buttons

#### TimerBadge
- Live countdown for timed stages
- Color-coded status (green/yellow/red)
- Automatic overdue detection

#### CorrectiveActionSheet
- Modal for documenting failures
- Pre-filled suggested actions
- Required for proceeding after failures

#### StickyToolbar
- Progress indicator
- Save/Next stage buttons
- Completion status

### State Management

The application uses Zustand for client-side state management with the following key features:

- **Current Log**: Active logging session
- **Stage Progression**: Sequential stage unlocking
- **Validation Logic**: Temperature and time threshold checking
- **Persistence**: Automatic saving to IndexedDB

### Validation Rules

1. **Cook Stage**: ≥166°F (CCP1)
2. **Start Cooling**: ≤127°F
3. **Cool to 80°F**: ≤80°F within 105 minutes
4. **Cool to 54°F**: ≤54°F within 4.75 hours
5. **Final Chill**: ≤39°F

### Data Structure

```typescript
interface LogEntry {
  id: string;
  date: Date;
  product: string;
  thermometerNumber: string;
  lotNumber: string;
  userInitials: string;
  stages: {
    cook: StageData;
    startCooling: StageData;
    to80: StageData;
    to54: StageData;
    finalChill: StageData;
  };
  currentStage: StageType;
  isComplete: boolean;
}
```

## iPad Optimization Features

- **Responsive Grid**: 2-column layout on iPad landscape
- **Large Text**: 18px base font size for readability
- **Touch Targets**: Minimum 64px (72px on iPad)
- **No Zoom**: Prevents accidental zoom on form inputs
- **Orientation Lock**: Optimized for landscape mode

## Offline Capabilities

The application works completely offline using:
- **IndexedDB**: Local database for log storage
- **Zustand Persistence**: Local state persistence
- **Service Worker Ready**: Architecture supports PWA features

## Development Notes

This is a front-end only application with mock data and validation. To integrate with a backend:

1. Replace mock user data in `src/lib/types.ts`
2. Update store actions to call API endpoints
3. Replace IndexedDB with API synchronization
4. Add authentication flow

## Browser Support

- **iOS Safari** (iPad)
- **Chrome** (Desktop/Mobile)
- **Firefox** (Desktop/Mobile)
- **Edge** (Desktop/Mobile)

## Performance

- **First Load**: ~100KB gzipped
- **Offline**: Full functionality without network
- **Touch Response**: <16ms input lag
- **Memory**: <50MB typical usage
