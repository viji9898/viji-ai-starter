import { Tag, Typography } from "antd";
import AppNavbar from "../components/AppNavbar";

const { Title } = Typography;

type HomePageProps = {
  currentPath: string;
  onLogout: () => void;
};

function HomePage({ currentPath, onLogout }: HomePageProps) {
  return (
    <div className="screen home-screen">
      <AppNavbar currentPath={currentPath} onLogout={onLogout} />
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
