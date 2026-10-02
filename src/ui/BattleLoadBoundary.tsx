import { Component, type ReactNode } from 'react';
export class BattleLoadBoundary extends Component<
  { children: ReactNode; onExit: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="menu-scene">
        <section className="wood-panel loading-panel">
          <h2>The arena could not load</h2>
          <p role="alert">
            The battle files could not load. Try again reloads this page.
          </p>
          <div className="stack">
            <button className="primary" onClick={() => location.reload()}>
              Try again
            </button>
            <button className="secondary" onClick={this.props.onExit}>
              Main Menu
            </button>
          </div>
        </section>
      </main>
    );
  }
}
