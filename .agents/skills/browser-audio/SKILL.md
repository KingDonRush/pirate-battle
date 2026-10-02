---
name: browser-audio
description: Implement browser Web Audio startup, decoded-buffer reuse, bounded voice mixing, suspension/recovery and asynchronous ownership. Use for interactive browser sound; product mix and feedback remain in the workflow.
metadata:
  author: Codex
  researched_on: '2026-10-02'
  provenance: Primary Web Audio documentation and actual browser lifecycle cases
---

# Browser audio ownership and recovery

> **Read contract:** reusable technology knowledge. Identify the browser, owner and actual failure before selecting a case. Product requirements choose the mix and timing. This source does not authorize new dependencies, services or permissions.

## Gesture, readiness and interruption

Create/resume AudioContext from the actual Play/Resume or equivalent user gesture, before awaiting loading. Autoplay permission and successful asset decoding are distinct readiness conditions. Do not assume a Promise continuation retains transient user activation. Catch rejected resume; preserve useful visible feedback and a gesture retry without blocking unrelated application work. `latencyHint: interactive` is a request, not a measured latency guarantee.

Suspended and interrupted states can have different browser causes. Page hide/focus loss may suspend hardware even when the app did not request it. Decide whether returning may automatically resume from the application's existing contract; never let a statechange handler override a deliberate user pause. Check the current owner again after resume resolves. Browser-specific silent-output issues require actual device investigation; a running state or headless node count cannot prove audible output.

Verify first gesture, denied resume, hidden/foreground recovery, mute and context teardown. Report emulation versus physical Safari/Android evidence separately. Sources: [autoplay](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay), [state](https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state), [best practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).

## Decoding and bounded voices

Short effects and short loops can use fetched/decoded AudioBuffers; long streamed tracks may justify media elements. Buffer memory scales with decoded samples/channels, not compressed download size. Reuse the buffer. An AudioBufferSourceNode starts only once: reuse its buffer in a new source rather than restarting a stopped source. Disconnect source/gain nodes and remove owned references on completion; explicit session cancellation must also stop unfinished voices.

Choose a meaningful maximum and priority policy. An effect rejected due to the limit should not hide essential state; visual feedback remains available. Concurrent variants of the same action may need one cue rather than one voice per particle/projectile. Gain changes use AudioParam automation to avoid abrupt clicks. A compressor is a tradeoff to evaluate by listening/measurement, not a default fix for an excessively loud mix.

Verify repeated fire, overlapping critical cues, muted output, completion callbacks, limits and loops after restarts. Use actual listening for clipping, loop seams, masking and perceived latency. Node counts supplement that review. Sources: [AudioBufferSourceNode](https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode), [AudioParam](https://developer.mozilla.org/en-US/docs/Web/API/AudioParam).

## Pause clocks and loop behavior

AudioContext time and simulation/presentation time are separate clocks. Suspending the context halts its time progression and processing; stopping one animation ticker does not suspend audio. Choose whether paused effects resume from their position or are discarded, and handle owned loop offsets accordingly. Loops can be suspended with the context or reconstructed from an explicit offset; reconstructing requires a new source and a decision about continuity.

A completion cue may belong to the application/result after combat voices stop. Give it a separate owner so session cleanup cannot cut it accidentally. Conversely, stale completion callbacks cannot create a new cue after application teardown. Verify mid-effect pause, long pause, resume, new session and result navigation. Source: [suspend](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/suspend).

## Late initialization and definitive teardown

An owner token plus generation distinguishes a current mount/session from one replaced during async decode. Abort owned downloads where supported; decoding already underway still needs the owner check on resolution. Old cleanup may only stop matching-owner voices, especially when a framework replaces the same match under Strict Mode. Do not suppress repeated setup with a global flag.

Close the context only at its actual application boundary. `close()` releases system resources but does not remove references to all created objects. Stop/disconnect voices, cancel requests, remove listeners, clear caches whose owner ended and release references too. Intentionally shared reusable buffers can remain only under a live owner with bounded purpose.

Exercise `init A → exit A → init B → A resolves`, denied/failed load, repeated session cycles and application disposal. A test that stops the owner itself before observing a leak does not establish its normal cleanup. Source: [close](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/close), [Web Audio specification](https://webaudio.github.io/web-audio-api/).

## Evidence boundary

Primary documentation explains mechanisms; static inspection does not prove browser output. Test exact ownership/voice/loop limits and failure paths, then listen and measure on the declared reference browser. Keep browser errors and player-facing messages classified. Publisher trust does not authorize running an upload/helper or capturing a microphone; ordinary playback requires neither.
