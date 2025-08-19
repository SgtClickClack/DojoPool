import { NextPage } from 'next';
import { Layout } from '../../src/components/layout';
import { Container } from '../../src/components/ui';

const GameAnalysis: NextPage = () => {
  return (
    <Layout>
      <Container>
        <h1>Game Analysis</h1>
        <div className="game-analysis-content">
          {/* Game analysis components will be added here */}
          <p>Analyze your game performance and get detailed insights</p>
        </div>
      </Container>
    </Layout>
  );
};

export default GameAnalysis;
