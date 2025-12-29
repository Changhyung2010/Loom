# Project Structure

This document outlines the organized structure of the TraceMind application.

## Directory Organization

```
mac-app-react/
├── public/                 # Static files and Electron main process
│   ├── electron.js        # Electron main process
│   ├── preload.js         # Electron preload script
│   └── index.html         # HTML template
│
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── layout/        # Layout components (Header, TabBar, FileSelector)
│   │   │   ├── Header.js
│   │   │   ├── Header.css
│   │   │   ├── TabBar.js
│   │   │   ├── TabBar.css
│   │   │   ├── FileSelector.js
│   │   │   ├── FileSelector.css
│   │   │   └── index.js
│   │   │
│   │   ├── views/         # View components (main content views)
│   │   │   ├── ExplanationPanel.js
│   │   │   ├── ExplanationPanel.css
│   │   │   ├── MindMapView.js
│   │   │   ├── MindMapView.css
│   │   │   ├── ChatView.js
│   │   │   └── index.js
│   │   │
│   │   ├── modals/        # Modal components
│   │   │   ├── SettingsModal.js
│   │   │   ├── SettingsModal.css
│   │   │   ├── TokenHistoryModal.js
│   │   │   ├── AuthWindow.js
│   │   │   ├── AuthWindow.css
│   │   │   └── index.js
│   │   │
│   │   └── index.js       # Main components export
│   │
│   ├── contexts/          # React Context providers
│   │   └── ThemeContext.js
│   │
│   ├── styles/            # Global styles and themes
│   │   └── theme.js
│   │
│   ├── utils/             # Utility functions
│   │   └── auth.js
│   │
│   ├── App.js             # Main application component
│   ├── App.css            # Main application styles
│   ├── index.js           # Application entry point
│   └── index.css          # Global styles
│
├── assets/                # Static assets (icons, etc.)
├── docs/                  # Documentation files
├── build/                 # Build output
├── dist/                  # Distribution files
└── package.json           # Dependencies and scripts

```

## Component Categories

### Layout Components (`src/components/layout/`)
Components that control the overall layout and navigation:
- **Header**: Application header with settings, tokens, user info
- **TabBar**: Tab navigation bar for multiple file/project tabs
- **FileSelector**: File and project selection interface

### View Components (`src/components/views/`)
Main content view components:
- **ExplanationPanel**: Main panel showing code explanations, origins, mind map, and chat
- **MindMapView**: Interactive mind map visualization
- **ChatView**: Chat interface for asking questions about code

### Modal Components (`src/components/modals/`)
Modal dialogs and overlays:
- **SettingsModal**: Application settings (API key, model, theme)
- **TokenHistoryModal**: Token usage history display
- **AuthWindow**: Authentication window component

## Import Examples

Using the index files for cleaner imports:

```javascript
// Before (still works):
import Header from './components/layout/Header';
import ExplanationPanel from './components/views/ExplanationPanel';

// Using index files (recommended):
import { Header, TabBar, FileSelector } from './components/layout';
import { ExplanationPanel, MindMapView, ChatView } from './components/views';
import { SettingsModal, TokenHistoryModal, AuthWindow } from './components/modals';

// Or from main components index:
import { Header, ExplanationPanel, SettingsModal } from './components';
```

## Benefits of This Structure

1. **Clear Organization**: Components are grouped by purpose (layout, views, modals)
2. **Easy Navigation**: Related components are in the same directory
3. **Scalability**: Easy to add new components to appropriate categories
4. **Maintainability**: Clear separation of concerns
5. **Clean Imports**: Index files allow for cleaner import statements

