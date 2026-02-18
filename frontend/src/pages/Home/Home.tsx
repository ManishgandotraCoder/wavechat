import { Socket } from 'socket.io-client';
import { Button, Form, Input, message } from 'antd';
import type { FormProps } from 'antd';
import { useEffect } from 'react';
import { CopyFilled } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { setSession } from '../../store/slices/sessionSlice';
import './styles.scss';

interface FormValues {
  connectionId: string;
  name: string;
  friendId?: string;
}

export default function Home({ socket }: { socket: Socket }) {
  const [form] = Form.useForm<FormValues>();
  const { connectionId, name } = useAppSelector((state) => state.session);
  const dispatch = useAppDispatch();
  const [messageApi, contextHolder] = message.useMessage();
  const connected = Boolean(connectionId && name);

  useEffect(() => {
    if (connectionId && name) {
      form.setFieldsValue({ connectionId, name });
      socket.emit('join', { connectionId, name });
    }
  }, [connectionId, name, form, socket]);

  const generateId = () => {
    const id = Math.floor(100000 + Math.random() * 900000);

    form.setFieldsValue({ connectionId: id.toString() });
  };

  const onFinish: FormProps<FormValues>['onFinish'] = (values) => {
    socket.emit('join', values);
    dispatch(setSession({ connectionId: values.connectionId, name: values.name }));
    messageApi.success('You are online');
  };

  const sendRequest = () => {
    const friendId = form.getFieldValue('friendId');
    const myId = form.getFieldValue('connectionId');

    if (!friendId) return messageApi.error('Enter friend ID');

    socket.emit('chat_request', {
      fromId: myId,
      toId: friendId
    });

    messageApi.success('Request sent');
  };

  const copyConnectionId = () => {
    const id = form.getFieldValue('connectionId');
    navigator.clipboard.writeText(id);
    messageApi.success('Copied');
  };

  return (
    <div>
      {contextHolder}

      <Form layout="vertical" form={form} onFinish={onFinish} className="form">
        <Form.Item
          label={<span data-testid="txt__label-connection-id">Connection ID</span>}
          name="connectionId"
          rules={[{ required: true }]}
          data-testid="txt__connection-id"
        >
          <Input
            disabled={connected}
            suffix={
              <Button disabled={connected} onClick={generateId} data-testid="txt__generate">
                Generate
              </Button>
            }
          />
        </Form.Item>

        <Form.Item
          label={<span data-testid="txt__label-name">Name</span>}
          name="name"
          rules={[{ required: true }]}
          data-testid="txt__name"
        >
          <Input disabled={connected} />
        </Form.Item>

        {!connected && (
          <Button htmlType="submit" type="primary" block data-testid="txt__start-session">
            Start Session
          </Button>
        )}

        {connected && (
          <>
            <p data-testid="txt__online-copy-id">
              You are online. Copy your Connection ID to share with others:
              <CopyFilled
                onClick={copyConnectionId}
                className='margin-8'
              />
            </p>

            <Form.Item
              label={<span data-testid="txt__label-friend-id">Friend ID</span>}
              name="friendId"
              data-testid="txt__friend-id">
              <Input />
            </Form.Item>

            <Button type="primary" block onClick={sendRequest} data-testid="txt__send-chat-request">
              Send Chat Request
            </Button>
          </>
        )}
      </Form>
    </div>
  );
}
