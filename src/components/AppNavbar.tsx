import { Button, Space } from "antd";
import { useNavigate } from "react-router-dom";
import EnvironmentBadge from "./EnvironmentBadge";

type AppNavbarProps = {
  currentPath: string;
  onLogout: () => void;
  userRole?: "admin" | "team";
};

function AppNavbar({ currentPath, onLogout, userRole }: AppNavbarProps) {
  const navigate = useNavigate();

  return (
    <div className="app-navbar">
      <Space wrap>
        <EnvironmentBadge />
        <Button
          type={currentPath === "/home" ? "primary" : "default"}
          onClick={() => navigate("/home")}
        >
          Home
        </Button>
        <Button
          type={currentPath === "/workspace-tests" ? "primary" : "default"}
          onClick={() => navigate("/workspace-tests")}
        >
          Workspace Tests
        </Button>
        {userRole === "admin" ? (
          <Button
            type={currentPath === "/domain-readonly" ? "primary" : "default"}
            onClick={() => navigate("/domain-readonly")}
          >
            Domain Operations
          </Button>
        ) : null}
      </Space>
      <Button onClick={onLogout}>Log out</Button>
    </div>
  );
}

export default AppNavbar;
