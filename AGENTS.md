# Stackflow POC Agent Guide

## Mission
- Evaluate https://github.com/daangn/stackflow against this React app to understand the default navigation experience and scroll retention.
- Prototype at least one custom Stackflow plugin and validate it inside the demo playground.
- Stress test stacked navigation with intentionally heavy components to observe render latency and memory behavior when the stack grows.

## Stackflow overview
- Implements mobile-style stack navigation in JavaScript: maintains scroll state, renders transition effects, and supports iOS-style swipe-back gestures while passing params to the target screen.
- UI is fully customizable: you can consume stack and transition state without a provided UI and extend the lifecycle through the plugin interface.
- Core logic is framework-agnostic; rendering can be injected, enabling the same flow to run in mobile webviews and desktop surfaces.
- Server-side rendering works via `ReactDOMServer.renderToString`, and all public functions ship with TypeScript definitions (current docs focus on React + React DOM).

## Future API watchpoints
- Previewing Stackflow 2.0: the refreshed API targets faster initial load times and introduces a Loader API that no longer depends on React.
- Feedback is encouraged because the preview can change; the legacy API still works for now but will be removed after 2.0 stabilizes.
- Upgrade the following packages before using Future API features: `@stackflow/config`, `@stackflow/core`, `@stackflow/react`, `@stackflow/plugin-history-sync`, and optionally `@stackflow/link`.
- Expect partial API drift while the preview evolves—double-check documentation when something feels inconsistent and confirm versions are up to date.

## Dev environment tips
- Install project deps with `npm install`; this repo currently uses `react-scripts`.
- Run the demo playground locally with `npm start`; it launches the dev server on http://localhost:3000 with fast refresh.
- Keep `npm test` running in watch mode while iterating to catch regressions from new plugins or stress components.
- Avoid committing `npm run build` artifacts from the Create React App toolchain; rebuild from scratch in CI instead.

## Experiment workflow
- Mirror the upstream Stackflow examples before customizing: clone the upstream repo under `playground/` or consume it through npm to compare behaviors quickly.
- When drafting a plugin, start with the official plugin template (e.g., `plugin-basic-ui`) and hook into lifecycle events for stack transitions.
- Capture measurements for heavy components by logging stack depth, frame timings, and memory snapshots; document the component shape and props used for stress runs.
- Record benchmark scenarios in a shared log (create `/docs/perf-notes.md` in this repo) so future agents can reuse or extend them.

## Testing instructions
- Unit and integration tests run through `npm test`; add React Testing Library suites that mount the stack and assert navigation semantics.
- Automate stress validations with vitals where possible—e.g., capture long task durations by extending the CRA supplied `web-vitals` hook.
- Before submitting changes, ensure custom plugins export types and runtime behavior behind feature flags so experiments do not break stable flows.

## Useful references
- Stackflow introduction: https://stackflow.so/docs/get-started/introduction
- Stackflow Future API docs: https://stackflow.so/api-references/future-api/introduction
- AGENTS format reference: https://agents.md/
