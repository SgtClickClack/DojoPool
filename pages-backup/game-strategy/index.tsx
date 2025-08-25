import { NextPage } from 'next';
import { Layout } from '../../src/components/layout';
import { Container } from '../../src/components/ui';

const GameStrategyPage: NextPage = () => {
  return (
    <Layout>
      <Container>
        <h1>Game Strategy</h1>
        <div className="game-strategy-content">
          {/* Strategy content sections will go here */}
          <section>
            <h2>Strategy Overview</h2>
            <p>Analyze and develop your game strategies.</p>
          </section>
        </div>
      </Container>
    </Layout>
  );
};

export default GameStrategyPage;
