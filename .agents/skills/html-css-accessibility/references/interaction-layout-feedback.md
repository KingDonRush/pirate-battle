# HTML/CSS: interaction semantics, layout and readable feedback

This chapter applies the W3C interaction patterns and WCAG understanding pages to concrete web interface cases. A guideline's formal requirement, an engineering recommendation and a selected product design are different claims. The workflow supplies the actual audience, art, language and layouts.

## U1. A visual action needs an interaction contract

A button activates an action; a link navigates to a resource. A clickable styled div may look right while lacking keyboard activation, a name or focus behavior. Native elements provide much of that contract and leave fewer custom branches to maintain. A decorative icon or image background remains presentation of the control, not a replacement for it.

Cases differ: an icon-only Close button needs a name; a labeled submit action must preserve its label during loading; an unavailable action needs an explanation where the user must make a decision. Removing a focused action during an async transition can lose the user's place. Do not add an ARIA role and assume the corresponding interaction has been implemented.

Verify role/name, Enter/Space where applicable, focus visibility and successful/error/pending states. Keep user copy specific to the next decision. Technical details are useful when diagnosing a requested network scenario, but a routine player's controls do not need library names.

Sources: [W3C patterns](https://www.w3.org/WAI/ARIA/apg/patterns/), [button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/).

## U2. Dialog focus and dismissal

A modal dialog establishes an interaction boundary. Move focus to a meaningful initial element, prevent unrelated background interaction as required, expose the dialog name, and restore focus when closing. A long explanatory dialog may benefit from focusing its heading/text rather than its last destructive action. A validation failure may need focus on the invalid field rather than reinitializing the entire dialog.

Native dialog behavior can reduce custom focus machinery, but its show/close lifecycle still must match UI state. Repeatedly showing it from rerenders, leaving it open after unmount or restoring focus to a removed trigger creates ownership bugs. Escape, backdrop dismissal and explicit Cancel should follow the product's intended discard policy rather than three inconsistent paths.

Test open, Tab/Shift+Tab traversal, validation, dismissal, reopened draft policy and focus return. A portal is a layout implementation detail; it does not establish the modal interaction by itself.

Sources: [modal dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [native dialog technique](https://www.w3.org/WAI/WCAG22/Techniques/html/H102).

## U3. Tabs, focus and asynchronous panels

Tab selection chooses a panel; keyboard focus may move between tab controls independently. When activating a panel incurs a noticeable load, manual activation can avoid making arrow navigation repeatedly trigger requests. Preserve the selected control/panel relationship and mark state explicitly.

Loading, empty, first failure and stale data refreshing need different panel feedback. A panel hidden visually but still mounted can retain data/subscriptions; this may be useful, but requires a deliberate freshness and resource policy. Removing the panel resets component-local state. Those are lifecycle choices, not CSS-only choices.

Verify arrow navigation and activation, selected/focused distinction, panel naming, a failed query with retry and a later tab revisit. Avoid unexpected focus movement on background refresh. Provide useful status announcements without rereading an entire list for every cache change.

Source: [tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/).

## U4. Held input and concurrent pointers

Pointerdown begins an interaction, while up/cancel/lost capture end it. A single global pressed boolean cannot distinguish two simultaneous fingers or a released finger from another still holding. Track per-pointer actions, and keep keyboard contributions separate so releasing one source does not cancel another source of the same action.

Capture allows the chosen element to retain pointer events as the contact moves outside it. Apply it to the element owning that interaction, not every screen globally. Browser scrolling/zoom can cancel a gesture; `touch-action` determines which behavior is available and must be scoped to the relevant controls. Visibility/blur/disposal also need a release policy.

Use cases include a drag handle, hold-to-repeat control, drawing canvas or concurrent directional/action controls. Verify down outside/up inside, down inside/up outside, cancel, two contacts, resize mid-contact and disposal while held. An emulated tap alone does not establish those lifecycles.

Sources: [pointer capture](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## U5. Reflow and target geometry

Viewport width, zoom, DPR and logical rendering coordinates are different quantities. A layout can fit a screenshot yet overflow when an error wraps, a label grows or the user zooms. Use content constraints and responsive organization rather than shrinking every element to preserve a fixed composition.

Assess targets by both size and spacing. WCAG's minimum target criterion has conditions/exceptions; a practical hold/touch control can need more room than its formal minimum. A dense data table and a repeated physical action control have different interaction costs. Preserve required content and an understandable reading order at narrow widths.

For canvas content, coordinate inversion belongs to the rendering contract, while semantic controls should reflow outside/over it without accidental clipping. An orientation suggestion cannot replace a usable visible path unless the workflow explicitly defines that limitation.

Sources: [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html), [minimum target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## U6. Contrast, motion and precise status

Color alone should not carry essential status. Pair meaningful states with text, shape or an additional cue. Verify text contrast against its actual changing background; a translucent overlay can differ from the flat design sample. Focus appearance needs its own visible state instead of merely reusing hover.

Reduced motion should preserve information while changing how it is delivered. A short state change can remain immediate; unnecessary continuous motion can stop. A collision/error indication still needs a recognizable result after motion is reduced. Audio feedback also needs a visible equivalent and should not start unexpectedly without the required user interaction.

Review copy by asking what decision each sentence enables. Replace vague promises with state and action: a failed save still has a recoverable pending operation, while an acknowledged save is complete. Do not add invented percentages, counts or “quality” badges to make a page feel substantial.

Sources: [contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [interaction animation](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html).

## U7. Security and evidence boundaries

Ordinary text can be rendered safely through semantic elements; external raw HTML/SVG requires an explicit trust/sanitization contract. A correct accessible label should not disclose a private payload or implementation stack. Browser storage/debugging controls also should not be exposed merely because they help an agent.

Automated accessibility scans and aria snapshots establish selected structural facts; they do not demonstrate readable art, physical touch usability or every focus transition. Review the actual rendered state with its input path. Record what was examined and keep functional, visual and accessibility evidence connected to the workflow's claim.

Source: [innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML), W3C patterns above.
