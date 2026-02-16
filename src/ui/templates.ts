export const appTemplate = `
  <main class="app">
    <button class="parent-hotspot" aria-label="Open parent settings"></button>
    <div class="parent-progress" aria-hidden="true"><span class="ring"></span></div>

    <button class="fullscreen-btn" id="fullscreenBtn" aria-label="Enter full screen">Full screen</button>
    <button class="exit-hotspot" id="exitHotspot" aria-label="Exit full screen (hold)"></button>
    <div class="exit-progress" id="exitProgress" aria-hidden="true"><span class="ring"></span></div>

    <section class="top-bar">
      <div class="title">Find It!</div>
      <div class="status" id="statusText">Tap start to begin</div>
    </section>

    <section class="board" id="board" aria-live="polite"></section>

    <section class="start-layer" id="startLayer">
      <button class="start-btn" id="startBtn">Tap to Start</button>
    </section>

    <section class="settings hidden" id="settingsPanel" role="dialog" aria-modal="true" aria-label="Parent settings">
      <h2>Parent Settings</h2>
      <label>
        Mode
        <select id="modeSelect">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
        </select>
      </label>
      <label>
        <input type="checkbox" id="voiceToggle" /> Voice prompts
      </label>
      <button id="closeSettings">Done</button>
    </section>
  </main>
`;
