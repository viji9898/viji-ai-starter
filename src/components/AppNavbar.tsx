import { Button, Space } from "antd";
import { useNavigate } from "react-router-dom";

type AppNavbarProps = {
  currentPath: string;
  onLogout: () => void;
};

function AppNavbar({ currentPath, onLogout }: AppNavbarProps) {
  const navigate = useNavigate();

  return (
    <div className="app-navbar">
      <Space wrap>
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
      </Space>
      <Button onClick={onLogout}>Log out</Button>
    </div>
  );
}

export default AppNavbar;
