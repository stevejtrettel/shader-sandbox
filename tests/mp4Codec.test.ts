import { describe, it, expect } from 'vitest';
import { pickH264Codec } from '../src/app/Mp4Encoder';

describe('pickH264Codec', () => {
  it('picks level 4.0 for 1080p30', () => {
    expect(pickH264Codec(1920, 1080, 30)).toBe('avc1.640028');
  });

  it('picks a level that actually fits 4K (old hardcoded 4.0 could not)', () => {
    const codec = pickH264Codec(3840, 2160, 30);
    // 4K = 32,400 macroblocks — needs at least level 5.1 (36,864)
    expect(['avc1.640033', 'avc1.640034']).toContain(codec);
  });

  it('scales the level with framerate', () => {
    // 4K60 exceeds 5.1's macroblock rate — needs 5.2
    expect(pickH264Codec(3840, 2160, 60)).toBe('avc1.640034');
  });

  it('reaches level 6.x for 8K', () => {
    expect(pickH264Codec(7680, 4320, 30)).toBe('avc1.64003c');
    expect(pickH264Codec(7680, 4320, 60)).toBe('avc1.64003d');
  });
});
