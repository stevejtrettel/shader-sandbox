import { describe, it, expect } from 'vitest';
import { Transport } from '../src/app/Transport';

/** Manual clock for deterministic time control. */
function makeClock(start = 100) {
  let now = start;
  return {
    clock: () => now,
    advance: (s: number) => { now += s; },
  };
}

describe('Transport', () => {
  it('tracks elapsed time from construction', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(5);
    expect(t.elapsed()).toBe(5);
  });

  it('freezes elapsed while paused (the old getCurrentTime bug)', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(3);
    t.pause();
    c.advance(10); // wall clock keeps moving
    expect(t.elapsed()).toBe(3); // shader time does not
  });

  it('resumes from where it paused', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(3);
    t.pause();
    c.advance(10);
    t.resume();
    c.advance(2);
    expect(t.elapsed()).toBe(5); // 3 before pause + 2 after resume
  });

  it('toggle returns the new state and round-trips', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    expect(t.toggle()).toBe(true);
    expect(t.isPaused).toBe(true);
    expect(t.toggle()).toBe(false);
    expect(t.isPaused).toBe(false);
  });

  it('pause/resume are idempotent', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(4);
    t.pause();
    t.pause();
    expect(t.elapsed()).toBe(4);
    t.resume();
    t.resume();
    c.advance(1);
    expect(t.elapsed()).toBe(5);
  });

  it('reset restarts from zero without changing pause state', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(7);
    t.reset();
    expect(t.elapsed()).toBe(0);
    c.advance(2);
    expect(t.elapsed()).toBe(2);
    expect(t.isPaused).toBe(false);
  });

  it('restore keeps shader time continuous across offline renders', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(8);
    const saved = t.elapsed();
    c.advance(120); // long offline render
    t.restore(saved);
    expect(t.elapsed()).toBe(8);
    c.advance(1);
    expect(t.elapsed()).toBe(9);
  });

  it('restore works while paused too', () => {
    const c = makeClock();
    const t = new Transport(c.clock);
    c.advance(8);
    t.pause();
    const saved = t.elapsed();
    c.advance(120);
    t.restore(saved);
    expect(t.elapsed()).toBe(8);
    expect(t.isPaused).toBe(true);
  });
});
