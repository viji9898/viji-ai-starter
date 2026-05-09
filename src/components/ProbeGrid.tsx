import { Button, Card, Col, Divider, Row, Space, Table, Typography } from "antd";
import type { ProbeDefinition, ProbeState } from "../types/app";

const { Paragraph, Text: AntText, Title: AntTitle } = Typography;

type DomainMeetMinutesRow = {
  key: string;
  fileId: string;
  title: string;
  meeting: string;
  mailbox: string;
  when: string;
  startedAt: number | null;
  conferenceId: string | null;
  fileUrl: string | null;
  error: string | null;
};

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

function parseDateValue(value: string) {
  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
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

  if (probeId === "domain-meet-minutes") {
    const totalUniqueMinutes =
      typeof parsed.totalUniqueMinutes === "number"
        ? parsed.totalUniqueMinutes
        : null;

    const minuteRows: DomainMeetMinutesRow[] = results
      .flatMap((item, index) => {
        const title =
          typeof item.title === "string" ? item.title : `Minutes ${index + 1}`;
        const fileUrl = typeof item.fileUrl === "string" ? item.fileUrl : null;
        const fileId = typeof item.fileId === "string" ? item.fileId : `file-${index}`;
        const error = typeof item.error === "string" ? item.error : null;
        const sourceEvents = Array.isArray(item.sourceEvents)
          ? item.sourceEvents.filter(
              (eventItem): eventItem is Record<string, unknown> =>
                Boolean(eventItem) && typeof eventItem === "object",
            )
          : [];

        if (sourceEvents.length === 0) {
          return [
            {
              key: `${fileId}-0`,
              fileId,
              title,
              meeting: "Unknown meeting",
              mailbox: "-",
              when: "-",
              startedAt: null,
              conferenceId: null,
              fileUrl,
              error,
            },
          ];
        }

        return sourceEvents.map((eventItem, eventIndex) => ({
          key: `${fileId}-${eventIndex}`,
          fileId,
          title,
          meeting:
            typeof eventItem.eventSummary === "string" && eventItem.eventSummary.trim()
              ? eventItem.eventSummary
              : "Untitled meeting",
          mailbox:
            typeof eventItem.mailbox === "string" ? eventItem.mailbox : "-",
          when:
            typeof eventItem.start === "string" && eventItem.start.trim()
              ? eventItem.start
              : "-",
          startedAt:
            typeof eventItem.start === "string" && eventItem.start.trim()
              ? parseDateValue(eventItem.start)
              : null,
          conferenceId:
            typeof eventItem.conferenceId === "string"
              ? eventItem.conferenceId
              : null,
          fileUrl,
          error,
        }));
      })
      .filter((row, index, rows) => {
        const dedupeKey = `${row.fileId}:${row.conferenceId ?? row.meeting}:${row.when}`;

        return (
          rows.findIndex(
            (candidate) =>
              `${candidate.fileId}:${candidate.conferenceId ?? candidate.meeting}:${candidate.when}` ===
              dedupeKey,
          ) === index
        );
      })
      .sort((left, right) => {
        if (left.startedAt === null && right.startedAt === null) {
          return 0;
        }

        if (left.startedAt === null) {
          return 1;
        }

        if (right.startedAt === null) {
          return -1;
        }

        return right.startedAt - left.startedAt;
      });

    return (
      <div className="summary-block">
        <div className="summary-item">
          <AntText className="summary-label">Unique minutes docs</AntText>
          <AntText className="summary-value">{totalUniqueMinutes ?? 0}</AntText>
        </div>
        <div className="summary-table-wrapper">
          <Table
            className="minutes-summary-table"
            columns={[
              {
                title: "Meeting",
                dataIndex: "meeting",
                key: "meeting",
                render: (value: string, row: DomainMeetMinutesRow) => (
                  <div>
                    <div className="minutes-table-title">{value}</div>
                    <div className="minutes-table-subtitle">{row.title}</div>
                  </div>
                ),
              },
              {
                title: "Mailbox",
                dataIndex: "mailbox",
                key: "mailbox",
              },
              {
                title: "Start",
                dataIndex: "when",
                key: "when",
              },
              {
                title: "Minutes",
                key: "minutes",
                render: (_value: unknown, row: DomainMeetMinutesRow) =>
                  row.error ? (
                    <AntText className="summary-error">{row.error}</AntText>
                  ) : row.fileUrl ? (
                    <Button type="link" href={row.fileUrl} target="_blank">
                      Open Gemini minutes
                    </Button>
                  ) : (
                    <AntText className="summary-value">No doc link</AntText>
                  ),
              },
            ]}
            dataSource={minuteRows}
            pagination={{
              pageSize: 10,
              hideOnSinglePage: true,
              showSizeChanger: true,
              pageSizeOptions: ["10", "25", "50"],
            }}
            size="small"
            scroll={{ x: 900 }}
          />
        </div>
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
        const isFullWidth = probe.id === "domain-meet-minutes";

        return (
          <Col xs={24} lg={isFullWidth ? 24 : 8} key={probe.id}>
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
