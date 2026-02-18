import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import { SocketProvider } from './contexts/SocketContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Routes from './pages';

import './_index.scss';
import ConfigProvider from 'antd/es/config-provider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <SocketProvider>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: '#D83A63', // your new primary color
                },
              }}
            >
              <Routes />
            </ConfigProvider>
          </SocketProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);
