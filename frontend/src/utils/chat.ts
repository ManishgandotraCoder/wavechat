export function getOtherUserIdFromRoom(roomId: string, myId: string | null): string | null {
  if (!roomId || !myId) return null;
  const ids = roomId.split('-');
  return ids.find((id) => id !== myId) ?? null;
}
