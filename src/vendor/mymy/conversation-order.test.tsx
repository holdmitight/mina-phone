import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { makeItem, initialRuntime } from '../../schema';
import { discoverMinaClue, normalizeMinaStoryRuntime, minaClueKeys } from '../../skins/minaStoryInteractions';
import { orderKakaoMessages } from './kakaoUnread';
import { replyToJeongyeonText, minaJeongyeonInteractiveMessages, parseJeongyeonTurns } from './mina-jeongyeon-replies';
import { replyToSanaText, parseSanaAdaptiveTurns } from './sanaAdaptive';
import { minaSanaInteractiveMessages } from './mina-sana-replies';
import { MymyKakao } from './Apps';
import actualStory from '../../../stories/template/story.json';
import { compileStory } from '../../story-engine/compiler';
const fixture = compileStory(actualStory).work;

const ping = makeItem({ id: 'mina-story-jeongyeon-gift-ping', title: 'Jeongyeon', time: '2025-11-09 21:09' });
describe('out-of-order player conversations', () => {
  it('keeps pre-arrival chat before a later ping and its answer after it, including reload', () => {
    const early = { ...replyToJeongyeonText('我捡到了米娜的手机', []), afterGift: false };
    const later = { ...replyToJeongyeonText('还没呢', [early]), afterGift: true };
    const turns = parseJeongyeonTurns([JSON.stringify(early), JSON.stringify(later)]);
    const messages = orderKakaoMessages([ping, ...minaJeongyeonInteractiveMessages(turns, ping)]);
    expect(messages.map(m => m.id)).toEqual(['mina-jeongyeon-interactive-0-input','mina-jeongyeon-interactive-0-reply',ping.id,'mina-jeongyeon-interactive-1-input','mina-jeongyeon-interactive-1-reply']);
    expect(messages.map(m => m.time)).toEqual(messages.map(m => m.time).sort());
    expect(messages.some(m => m.time.includes('22:00'))).toBe(false);
  });
  it('recognizes the screenshot denial and correction without pretending agreement', () => {
    const deny = replyToSanaText('我不是呢', []);
    expect(deny.topic).toBe('phone-not-mina');
    expect(deny.replies[0]).toContain('誰');
    const correction = replyToSanaText('说得不对啊啊啊', [deny]);
    expect(correction.topic).toBe('correction');
    expect(correction.replies[0]).toContain('決めつけ');
    expect(replyToJeongyeonText('没有 还没呢', []).topic).toBe('not-yet');
    expect(replyToJeongyeonText('你理解错了', []).topic).toBe('correction');
  });
  it('places early Sana input before the story prompt without replaying the Mina intro', () => {
    const early = { ...replyToSanaText('我不是呢', []), beforePrompt: true };
    const turn = parseSanaAdaptiveTurns([JSON.stringify(early)])[0];
    const sanaPing = { ...ping, id:'mina-story-cafe-sana-ping', title:'Sana' };
    const messages = orderKakaoMessages([sanaPing, ...minaSanaInteractiveMessages(sanaPing, 'direct', '', '', [], [turn])]);
    expect(messages.map(m => m.body)).not.toContain('よかった〜笑');
    expect(messages[0].body).toBe('我不是呢');
    expect(messages.at(-1)?.id).toBe(sanaPing.id);
  });
  it('contextualizes both arrivals after early disclosure and never duplicates them', () => {
    let state = initialRuntime(fixture);
    state = { ...state, ui: { ...state.ui, kakao: {
      minaSanaChatTurns: [JSON.stringify({ ...replyToSanaText('我不是呢', []), beforePrompt:true })],
      minaJeongyeonChatTurns: [JSON.stringify({ ...replyToJeongyeonText('我捡到了手机', []), afterGift:false })],
    } } };
    state = discoverMinaClue(state, minaClueKeys.cafeVisit);
    state = discoverMinaClue(state, minaClueKeys.jeongyeonTalk);
    expect(state.messages.kakao.find(m => m.id === 'mina-story-cafe-sana-ping')?.body).toContain('返す方法');
    state = discoverMinaClue(state, minaClueKeys.sanaFinished);
    const gift = state.messages.kakao.find(m => m.id === ping.id)!;
    expect(gift.body).not.toContain('성공했어');
    expect(gift.meta.zh).toContain('米娜之前');
    expect(discoverMinaClue(state, minaClueKeys.sanaFinished)).toBe(state);
  });
  it('repairs an old identity denial in the opening without displaying reply suggestions', () => {
    const html = renderToStaticMarkup(createElement(MymyKakao, {
      appId:'kakao', name:'KakaoTalk', owner:'名井南', creator:false, thread:'Sana',
      items:[makeItem({id:'kaka-sana-1',title:'Sana'}),makeItem({id:'kaka-jeongyeon-1',title:'Jeongyeon'}), makeItem({id:'mina-story-cafe-sana-ping',title:'Sana',time:'2025-11-09 21:09'})],
      ui:{minaSanaReplyStage:'awake',minaSanaAwakeText:'我不是呢'},
      onUi:vi.fn(),onBack:vi.fn(),onThread:vi.fn(),onItem:vi.fn(),onRead:vi.fn(),onAdd:vi.fn(),
    }));
    expect(html).not.toContain('よかった〜笑');
    expect(html).toContain('あなたは誰');
    expect(html).not.toContain('接话建议');
  });
});

it('repairs an already-delivered stale question in a saved game without replaying notifications', () => {
  let state = discoverMinaClue(initialRuntime(fixture), minaClueKeys.sanaFinished);
  state = { ...state, ui: { ...state.ui, kakao: { minaJeongyeonChatTurns: [JSON.stringify(replyToJeongyeonText('我不是米娜', []))] } } };
  const fixed = normalizeMinaStoryRuntime(state);
  expect(fixed.messages.kakao.filter(m => m.id === ping.id)).toHaveLength(1);
  expect(fixed.messages.kakao.find(m => m.id === ping.id)?.meta.zh).toContain('米娜之前');
  expect(fixed.notifications).toHaveLength(state.notifications.length);
  expect(fixed.ui).toEqual(state.ui);
  expect(normalizeMinaStoryRuntime(fixed)).toBe(fixed);
});
