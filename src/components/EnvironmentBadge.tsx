import { Tag } from "antd";

const environmentLabel = import.meta.env.DEV ? "DEV" : "LIVE";

function EnvironmentBadge() {
  return (
    <Tag className={`environment-badge environment-badge-${environmentLabel.toLowerCase()}`}>
      {environmentLabel}
    </Tag>
  );
}

export default EnvironmentBadge;