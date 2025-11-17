# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-11-17

### Added
- Added application versioning
- Added experimental initial menu structure
- Added URL input field for each column to visit every website
- Renderer now reads panel list from config.js (fallback to defaults)
- Expanded selector sets for ChatGPT/Claude/Grok/Gemini/Venice with Shadow DOM traversal for input targeting
- Fallback to the currently focused element to fill the prompt when no selector matches
- Panel headers now adopt the loaded page title or host instead of fixed names.

### Fixed
- Prompt injection reliability: deeper traversal (incl. Shadow DOM), visibility checks, increased delays for lazy inputs, plus focus/click and input/change/enter event sequence for React/Vue/SPAs

### Documentation
- Reworked readme file for more clarity
- Added gitmessage

## [1.0.0] - 2025-11-16

### Added
- Initial project setup
- Multi-panel Electron app with side-by-side webviews
- Meta-prompt bar to broadcast input to all AI panels
- Support for ChatGPT, Grok, Claude, Venice, Gemini and other web-based AI services
- Configurable panel URLs via config.js

### Fixed
- Resolved node_modules tracking issue in git

### Documentation
- Added comprehensive README.md
- Added .gitignore for Node.js projects