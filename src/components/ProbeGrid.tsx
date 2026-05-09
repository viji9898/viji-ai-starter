import { Button, Card, Col, Divider, Row, Space, Typography } from "antd";
import type { ProbeDefinition, ProbeState } from "../types/app";

const { Paragraph, Text: AntText, Title: AntTitle } = Typography;

type ProbeGridProps = {
  onRunProbe: (probe: ProbeDefinition) => void;
  probeResults: Record<string, ProbeState>;
  probes: ProbeDefinition[];
};

function parseProbeOutput(output?: string) {
  if (!output) {
    return null;
  }

  try {
    return JSON.parse(output) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function renderDomainSummary(probeId: string, output?: string) {
  const parsed = parseProbeOutput(output);

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  if (probeId === "domain-users-readonly") {
    const totalUsers = parsed.totalUsers;

    if (typeof totalUsers !== "number") {
      return null;
    }

    return (
      <div className="summary-block">
        <div className="summary-item">
          <AntText className="summary-label">Directory users</AntText>
          <AntText className="summary-value">{totalUsers}</AntText>
        </div>
      </div>
    );
  }

  const results = Array.isArray(parsed.results)
    ? (parsed.results as Array<Record<string, unknown>>)
    : null;

  if (!results) {
    return null;
  }

  if (probeId === "domain-task") {
    return (
      <div className="summary-block">
        {results.map((item, index) => {
          const mailbox =
            typeof item.subject === "string"
              ? item.subject
              : typeof item.mailbox === "string"
                ? item.mailbox
                : `Mailbox ${index + 1}`;
          const totalTaskLists =
            typeof item.totalTaskLists === "number" ? item.totalTaskLists : null;
          const totalTasks =
            typeof item.totalTasks === "number" ? item.totalTasks : null;
          const error = typeof item.error === "string" ? item.error : null;

          return (
            <div className="summary-item" key={mailbox}>
              <div className="summary-header">
                <AntText className="summary-title">{mailbox}</AntText>
              </div>
              {error ? (
                <AntText className="summary-error">{error}</AntText>
              ) : (
                <AntText className="summary-value">
                  {totalTasks ?? 0} tasks across {totalTaskLists ?? 0} lists
                </AntText>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (probeId === "domain-meet") {
    return (
      <div className="summary-block">
        {results.map((item, index) => {
          const mailbox =
            typeof item.mailbox === "string" ? item.mailbox : `Mailbox ${index + 1}`;
          const totalMeetEvents =
            typeof item.totalMeetEvents === "number" ? item.totalMeetEvents : null;
          const totalCalendarEvents =
            typeof item.totalCalendarEvents === "number"
              ? item.totalCalendarEvents
              : null;
          const error = typeof item.error === "string" ? item.error : null;

          return (
            <div className="summary-item" key={mailbox}>
              <div className="summary-header">
                <AntText className="summary-title">{mailbox}</AntText>
              </div>
              {error ? (
                <AntText className="summary-error">{error}</AntText>
              ) : (
                <AntText className="summary-value">
                  {totalMeetEvents ?? 0} Meet events out of {totalCalendarEvents ?? 0}
                  {" "}calendar events this month
                </AntText>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}

function ProbeGrid({ onRunProbe, probeResults, probes }: ProbeGridProps) {
  return (
    <Row gutter={[18, 18]}>
      {probes.map((probe) => {
        const result = probeResults[probe.id];
        const busy = result?.status === "running";

        return (
          <Col xs={24} lg={8} key={probe.id}>
            <Card className="panel probe-card" variant="borderless">
              <Space direction="vertical" size="middle" className="fill-width">
                <div>
                  <AntTitle level={4}>{probe.title}</AntTitle>
                  <Paragraph>{probe.description}</Paragraph>
                </div>
                <Button
                  type="primary"
                  onClick={() => onRunProbe(probe)}
                  loading={busy}
                >
                  Run function
                </Button>
                <Divider className="probe-divider" />
                {renderDomainSummary(probe.id, result?.output) ? (
                  <>
                    <AntText className="panel-label">Summary</AntText>
                    {renderDomainSummary(probe.id, result?.output)}
                    <AntText className="panel-label">Raw response</AntText>
                  </>
                ) : (
                  <AntText className="panel-label">Latest response</AntText>
                )}
                <pre className="result-block">
                  {result?.output ??
                    '{\n  "success": null,\n  "status": "idle"\n}'}
                </pre>
              </Space>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
}

export default ProbeGrid;
