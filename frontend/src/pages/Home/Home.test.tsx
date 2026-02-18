import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import { store } from '../../store';
import { clearSession } from '../../store/slices/sessionSlice';
import { setIncomingRequest } from '../../store/slices/homeSlice';
import Home from './Home';
import { Socket } from 'socket.io-client';

function makeMockSocket() {
  return {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  };
}

function renderWithStore(ui: React.ReactElement) {
  return render(
    <Provider store={store}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  );
}

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    store.dispatch(clearSession());
    store.dispatch(setIncomingRequest(null));
  });

  it('shows the connection ID field so the user can enter or generate an ID', () => {
    const socket = makeMockSocket();
    renderWithStore(<Home socket={socket as unknown as Socket} />);

    expect(screen.getByTestId('txt__label-connection-id').textContent).toBe('Connection ID');
    expect(screen.getByTestId('txt__generate').textContent).toBe('Generate');
  });

  it('shows the Name field so the user can enter their name', () => {
    const socket = makeMockSocket();
    renderWithStore(<Home socket={socket as unknown as Socket} />);

    expect(screen.getByTestId('txt__label-name').textContent).toBe('Name');
  });

  it('shows Start Session button when the user is not connected yet', () => {
    const socket = makeMockSocket();
    renderWithStore(<Home socket={socket as unknown as Socket} />);

    const startButton = screen.getByTestId('txt__start-session');
    expect(startButton.textContent).toBe('Start Session');
  });

  it('does not register incoming_request or chat_started (handled centrally in Routes)', () => {
    const socket = makeMockSocket();
    renderWithStore(<Home socket={socket as unknown as Socket} />);
    expect(socket.on).not.toHaveBeenCalledWith('incoming_request', expect.any(Function));
    expect(socket.on).not.toHaveBeenCalledWith('chat_started', expect.any(Function));
  });
});
