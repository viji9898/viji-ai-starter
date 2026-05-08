import { Button, Card, Col, Divider, Row, Space, Typography } from "antd";
import type { ProbeDefinition, ProbeState } from "../types/app";

const { Paragraph, Text: AntText, Title: AntTitle } = Typography;

type ProbeGridProps = {
  onRunProbe: (probe: ProbeDefinition) => void;
  probeResults: Record<string, ProbeState>;
  probes: ProbeDefinition[];
};

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
                <AntText className="panel-label">Latest response</AntText>
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
