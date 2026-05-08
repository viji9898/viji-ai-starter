import { Card, Layout, Space, Spin, Typography } from "antd";

const { Content } = Layout;
const { Text, Title } = Typography;

function SessionRestorePage() {
  return (
    <Layout className="app-shell">
      <Content className="app-content">
        <div className="screen landing-screen">
          <Card className="panel panel-accent" variant="borderless">
            <Space direction="vertical" size="middle" className="fill-width">
              <Text className="panel-label">Restoring session</Text>
              <Title level={3}>Checking your saved Google login</Title>
              <Space>
                <Spin size="small" />
                <Text>Revalidating your token with the backend...</Text>
              </Space>
            </Space>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}

export default SessionRestorePage;
