import { Tag, Typography } from "antd";
import AppNavbar from "../components/AppNavbar";
import ProbeGrid from "../components/ProbeGrid";
import UserIdentityCard from "../components/UserIdentityCard";
import type {
  AuthenticatedUser,
  ProbeDefinition,
  ProbeState,
} from "../types/app";

const { Paragraph, Title } = Typography;

type WorkspaceTestsPageProps = {
  currentPath: string;
  onLogout: () => void;
  onRunProbe: (probe: ProbeDefinition) => void;
  probeResults: Record<string, ProbeState>;
  probes: ProbeDefinition[];
  user: AuthenticatedUser;
};

function WorkspaceTestsPage({
  currentPath,
  onLogout,
  onRunProbe,
  probeResults,
  probes,
  user,
}: WorkspaceTestsPageProps) {
  return (
    <div className="screen workspace-tests-screen">
      <AppNavbar currentPath={currentPath} onLogout={onLogout} />
      <section className="home-header">
        <div>
          <Tag className="eyebrow">Workspace Tests</Tag>
          <Title>Workspace Tests</Title>
          <Paragraph className="lead">
            Run focused backend checks for Gmail, Calendar, Drive, Tasks, Docs,
            Sheets, Admin SDK, Analytics, OpenAI, SendGrid, and Neon database
            access using the current authenticated user and the configured backend
            credentials.
          </Paragraph>
        </div>
      </section>
      <UserIdentityCard currentPath={currentPath} user={user} />
      <ProbeGrid
        onRunProbe={onRunProbe}
        probeResults={probeResults}
        probes={probes}
      />
    </div>
  );
}

export default WorkspaceTestsPage;
