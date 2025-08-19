import { type NextPage } from 'next';
// import { AICommentaryHighlightsDashboard } from '../../../../../apps/web/src/components/ai/AICommentaryHighlightsDashboard';

const AICommentaryHighlightsPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎙️ AI Commentary & Highlights
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered match commentary and highlight generation system
          </p>
        </div>

        {/* <AICommentaryHighlightsDashboard /> */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            AI Commentary Dashboard
          </h2>
          <p className="text-gray-600">
            AI commentary and highlights dashboard temporarily unavailable. This
            component will be implemented in a future update.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AICommentaryHighlightsPage;
