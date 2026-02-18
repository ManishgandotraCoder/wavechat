import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router';
import { store } from '../../store';
import { setSession } from '../../store/slices/sessionSlice';
import Chat from './Chat';
import { Socket } from 'socket.io-client';

function makeMockSocket() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  };
}

function renderChat(socket: ReturnType<typeof makeMockSocket>) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/chat/111-222']}>
        <Routes>
          <Route path="/chat/:userId" element={<Chat socket={socket as unknown as Socket} />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
}

describe('Chat page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(setSession({ connectionId: '111', name: 'Test' }));
  });

  it('shows End Chat button so the user can leave the chat', () => {
    const socket = makeMockSocket();
    renderChat(socket);

    const endButton = screen.getByTestId('txt__end-chat');
    expect(endButton.textContent).toBe('End Chat');
  });

  it('shows the other user ID in the header when room ID has two IDs', () => {
    const socket = makeMockSocket();
    renderChat(socket);

    // My ID is 111, so the other user in room 111-222 is 222
    expect(screen.getByTestId('txt__other-user-id').textContent).toBe('222');
  });

  it('shows the message input and Send button so the user can type and send messages', () => {
    const socket = makeMockSocket();
    renderChat(socket);

    expect(screen.getByTestId('txt__message-input')).toBeTruthy();
    expect(screen.getByTestId('txt__send').textContent).toBe('Send');
  });

  it('registers socket listeners for receiving messages and chat ended', () => {
    const socket = makeMockSocket();
    renderChat(socket);

    expect(socket.on).toHaveBeenCalledWith('receive_message', expect.any(Function));
    expect(socket.on).toHaveBeenCalledWith('chat_ended', expect.any(Function));
  });
});
