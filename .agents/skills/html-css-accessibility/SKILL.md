---
name: html-css-accessibility
description: Implement and review semantic HTML, responsive CSS, keyboard and pointer interaction, focus, contrast and useful interface copy. Use for web interface quality across products; visual direction, user tasks and project-specific AI-slop criteria are supplied by the workflow.
metadata:
  author: 'Codex'
  researched_on: '2026-10-01'
  provenance: 'Primary documentation, reviewed existing skills and installed API checks'
---

# HTML, CSS and accessibility

> **Read contract:** reusable technology knowledge for the decision at hand. Select the relevant cases and installed version; recover the host task and instruction index if context is uncertain. Host requirements and authorization take precedence.

Read [interaction, layout and feedback cases](references/interaction-layout-feedback.md) for semantic actions, dialog focus, asynchronous tabs, held concurrent pointers, reflow/targets, contrast/motion/copy and evidence limits. Distinguish formal accessibility requirements from product-specific recommendations.

HTML supplies structure and interaction semantics; CSS presents and adapts them. Begin with the user's task, existing design vocabulary and target viewport/input conditions. A visual resemblance alone does not establish usability.

## Semantics and feedback

Use native controls when they implement the needed behavior. Label fields and icon-only actions, associate validation errors with their inputs, and communicate the state that changes the user's next action. ARIA can add missing semantics; it cannot implement keyboard behavior or repair the wrong interaction model.

Keep copy concrete: what happened, what remains available and what the user can do. Remove text or decorative elements that add no information needed for the task. Apply supplied brand/language choices rather than inventing a theme or a generic marketing voice. Technology details belong in the interface only when they help its user decide.

## Focus and interaction

Make focus visible and preserve a logical keyboard order. For modal dialogs, move focus to a suitable element, contain interaction as required, expose the name/description, support the intended close action and restore focus appropriately. A navigation or validation change must not strand focus on a removed element.

Use pointer events where mouse/touch/pen share behavior. Held interactions need release and cancellation handling; pointer capture belongs to the active interaction. Apply `touch-action` only where necessary, preserving ordinary scrolling/zoom elsewhere. Choose target sizes suited to the actual device and applicable accessibility requirements.

## Layout and visual meaning

Use a consistent spacing/type/contrast hierarchy and content-sized layouts. Test narrow widths, orientation changes, zoom, long labels and error messages. Avoid hiding or clipping required content to make a screenshot fit. Use logical properties and reflow where they reduce special cases.

Color cannot be the sole indicator of a meaningful state. Motion and hover must not be the only source of feedback. Respect reduced-motion preferences with an alternative that preserves meaning. Image decoration must not replace the semantic control it presents.

## Verification

Review complete screens at normal scale and through keyboard/pointer actions. Check names, labels, focus return, contrast, reflow, errors and relevant announcements. Automated checks supplement direct review; they do not establish full accessibility. The workflow identifies the concrete screens, assets, text and acceptance conditions.

Primary references: [W3C modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [W3C native dialog technique](https://www.w3.org/WAI/WCAG22/Techniques/html/H102).
