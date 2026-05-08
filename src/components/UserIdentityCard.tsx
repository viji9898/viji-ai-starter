import { Avatar, Card, Space, Tag, Typography } from "antd";
import type { AuthenticatedUser } from "../types/app";

const { Paragraph: AntParagraph, Text: AntText, Title: AntTitle } = Typography;

type UserIdentityCardProps = {
  currentPath: string;
  user: AuthenticatedUser;
};

function UserIdentityCard({ currentPath, user }: UserIdentityCardProps) {
  return (
    <Card className="panel identity-panel" variant="borderless">
      <Space size="large" align="start" wrap>
        <Avatar size={72} src={user.picture}>
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <div className="identity-copy">
          <AntTitle level={3}>{user.name}</AntTitle>
          <AntParagraph>
            <AntText strong>{user.email}</AntText>
          </AntParagraph>
          <Space wrap>
            <Tag color="green">Role: {user.role}</Tag>
            <Tag color="gold">Domain: {user.hd}</Tag>
            <Tag>Route: {currentPath}</Tag>
          </Space>
        </div>
      </Space>
    </Card>
  );
}

export default UserIdentityCard;
