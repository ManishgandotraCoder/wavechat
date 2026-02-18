import { Button, message } from "antd";
import { Header } from "antd/es/layout/layout";
import { LogoutOutlined } from '@ant-design/icons';
import { Socket } from "socket.io-client";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearSession } from "../../store/slices/sessionSlice";
import { setConnectionStatus } from "../../store/slices/connectionSlice";
import type { ConnectionStatus } from "../../store/slices/connectionSlice";
import './styles.scss'

const statusLabel: Record<ConnectionStatus, string> = {
  connected: '',
  reconnecting: 'Reconnecting…',
  disconnected: 'Disconnected',
};

const HeaderComponent = ({ socket }: { socket: Socket }) => {
    const { name, connectionId } = useAppSelector((state) => state.session);
    const connectionStatus = useAppSelector((state) => state.connection?.status ?? 'disconnected');
    const dispatch = useAppDispatch();

    const handleClearSession = () => {
        socket.disconnect();
        dispatch(setConnectionStatus('disconnected'));
        dispatch(clearSession());
        message.info('Session cleared');
        window.location.href = '/';
    };

    const label = statusLabel[connectionStatus];

    return (
        <Header className="header">
            <span className="logo" data-testid="txt__wave-chat">
                Wave Chat
            </span>

            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                {label ? (
                    <span className="connection-status" data-testid="txt__connection-status">
                        {label}
                    </span>
                ) : null}

                {connectionId && name && (
                    <Button
                        className="clear-session"
                        icon={<LogoutOutlined />}
                        onClick={handleClearSession}
                        data-testid="txt__clear-session"
                    >
                        Clear Session
                    </Button>
                )}
            </div>
        </Header>
    );
};

export default HeaderComponent;
