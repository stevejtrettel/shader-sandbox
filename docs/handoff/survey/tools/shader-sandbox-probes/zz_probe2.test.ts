import { it, expect } from 'vitest';
import { OfflineRenderer } from '../src/app/OfflineRenderer';
import { Transport } from '../src/app/Transport';
import { Mp4Encoder, pickH264Codec } from '../src/app/Mp4Encoder';

it('HD still of a script-driven, buffer-less shader never calls onFrame', async () => {
  let onFrameCalls = 0; const steps: number[] = [];
  const canvas: any = { width: 800, height: 450, toBlob: (cb: any) => cb({}) };
  const engine: any = { resize() {}, reset() {}, step: (t: number) => steps.push(t) };
  const view: any = { canvas, engine, suspendResizeTracking() {}, resumeResizeTracking() {}, presentToScreen() {} };
  const or = new OfflineRenderer({ view, transport: new Transport(() => 5), hasBufferPasses: () => false,
    hasOnFrameScript: () => true, runOnFrame: () => { onFrameCalls++; }, runSetup() {}, runSetupOrThrow() {}, notifyPauseState() {} });
  await or.captureScreenshot({ width: 3840, height: 2160, time: 2, hasBuffers: false, onProgress() {} });
  console.log('onFrame calls:', onFrameCalls, 'engine.step times:', steps);
  expect(onFrameCalls).toBe(0);
});
it('codec edge cases', () => {
  console.log('16K', pickH264Codec(15360, 8640, 30), 'odd', new (Mp4Encoder as any)(1921, 1081, 30).encodedWidth);
});
