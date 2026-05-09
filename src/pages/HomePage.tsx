import { Tag, Typography } from "antd";
import AppNavbar from "../components/AppNavbar";

const { Title } = Typography;

type HomePageProps = {
  currentPath: string;
  onLogout: () => void;
  userRole: "admin" | "team";
};

function HomePage({ currentPath, onLogout, userRole }: HomePageProps) {
  return (
    <div className="screen home-screen">
      <AppNavbar
        currentPath={currentPath}
        onLogout={onLogout}
        userRole={userRole}
      />
      <section className="home-header">
        <div>
          <Tag className="eyebrow">Authenticated workspace</Tag>
          <Title>Home</Title>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
