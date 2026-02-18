import { describe, it, expect } from 'vitest';
import { generateRoomId } from './chatHandlers';

describe('generateRoomId', () => {
  it('joins two user IDs with a hyphen so we get one room ID for both users', () => {
    const id1 = '111';
    const id2 = '222';
    const roomId = generateRoomId(id1, id2);
    expect(roomId).toBe('111-222');
  });

  it('sorts the IDs so the same room is used no matter who is first', () => {
    expect(generateRoomId('aaa', 'bbb')).toBe('aaa-bbb');
    expect(generateRoomId('bbb', 'aaa')).toBe('aaa-bbb');
  });

  it('works when IDs are numbers as strings', () => {
    expect(generateRoomId('999', '100')).toBe('100-999');
  });
});
