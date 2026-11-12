import { describe, expect, it } from 'vitest';
import story from '../../stories/template/story.json';
import { compileStory } from '../story-engine/compiler';
import { minaKakao2025Lines } from '../vendor/mymy/mina-kakao-2025';

describe('Mina private notes', () => {
  const work = compileStory(story).work;
  it('uses the authored reunion date without advertising the credential', () => {
    const reunion = minaKakao2025Lines.find(line => line.id === 'kaka-2025-sana-01')!;
    const date = reunion.time.slice(5,10).replace('-','');
    const draft = work.data.notes.find(note => note.id === 'note-draft')!;
    expect(draft.password).toBe(date);
    expect(draft.title).toBe('君だけのページ');
    expect(draft.meta.passwordHint).toContain('Sana');
    expect(draft.meta.passwordHint).toContain('KakaoTalk');
    expect(draft.meta.passwordHintZh).toContain('安可舞台');
    expect(draft.meta.passwordHint).not.toContain(date);
    expect(draft.meta.passwordHintZh).not.toContain(date);
    for (const note of work.data.notes) {
      expect(note.title).not.toContain(date);
      expect(note.body).not.toContain('0324');
      expect(note.body).not.toContain(date);
    }
    expect(work.phone.passcode).toBe('0324');
  });
  it('removes the in-game about note and writes a changed attitude to A', () => {
    expect(work.data.notes.some(note => note.id === 'note-about')).toBe(false);
    const draft = work.data.notes.find(note => note.id === 'note-draft')!;
    expect(draft.body).toContain('今の君に、もう一度会いたい');
    expect(draft.body).toContain('君が選んだ答え');
    expect(draft.body).toContain('まだ、好きです');
    expect(work.data.notes.find(note => note.id === 'note-pinned')!.body).not.toContain('スープ作ってあるよ');
  });
});
