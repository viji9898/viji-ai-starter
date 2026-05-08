import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Alert, Button, Card, Space, Spin, Typography } from "antd";

const { Paragraph, Text } = Typography;

type LandingPageProps = {
  authError: string | null;
  authPending: boolean;
  clientIdConfigured: boolean;
  onGoogleSuccess: (credentialResponse: CredentialResponse) => void;
};

function LandingPage({
  authError,
  authPending,
  clientIdConfigured,
  onGoogleSuccess,
}: LandingPageProps) {
  return (
    <div className="screen landing-screen">
      <Card className="panel panel-accent login-card" variant="borderless">
        <Space
          direction="vertical"
          size="large"
          className="fill-width login-panel"
        >
          {!clientIdConfigured ? (
            <Alert
              type="warning"
              showIcon
              title="VITE_GOOGLE_CLIENT_ID is not configured"
              description="Set your Google client id in .env before trying Sign-In."
            />
          ) : null}
          {authError ? (
            <Alert
              type="error"
              showIcon
              title="Authentication failed"
              description={authError}
            />
          ) : null}
          <div className="login-slot login-slot-centered">
            {clientIdConfigured ? (
              authPending ? (
                <Space>
                  <Spin size="small" />
                  <Text>Verifying token with the backend...</Text>
                </Space>
              ) : (
                <GoogleLogin
                  onSuccess={onGoogleSuccess}
                  onError={() => undefined}
                  shape="pill"
                  text="continue_with"
                  theme="filled_blue"
                />
              )
            ) : (
              <Button type="primary" size="large" disabled>
                Google Sign-In unavailable
              </Button>
            )}
          </div>
          <Paragraph className="login-description">
            Sign in with your Google Workspace account to continue.
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}

export default LandingPage;
