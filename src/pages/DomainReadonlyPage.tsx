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

type DomainReadonlyPageProps = {
  currentPath: string;
  onLogout: () => void;
  onRunProbe: (probe: ProbeDefinition) => void;
  probeResults: Record<string, ProbeState>;
  probes: ProbeDefinition[];
  user: AuthenticatedUser;
};

function DomainReadonlyPage({
  currentPath,
  onLogout,
  onRunProbe,
  probeResults,
  probes,
  user,
}: DomainReadonlyPageProps) {
  return (
    <div className="screen domain-readonly-screen">
      <AppNavbar
        currentPath={currentPath}
        onLogout={onLogout}
        userRole={user.role}
      />
      <section className="home-header">
        <div>
          <Tag className="eyebrow">Domain Operations</Tag>
          <Title>Domain Operations</Title>
          <Paragraph className="lead">
            Run admin-only delegated operations that query the domain directory
            and the configured allowlisted task mailboxes. The domain task
            probe returns mailbox totals alongside the task list data for the
            allowlisted operational mailboxes. These routes remain separate
            from the existing workshop tests.
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

export default DomainReadonlyPage;