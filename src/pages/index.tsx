console.log('[DEBUG] index.tsx loaded');

function Main() {
  const { player, isLoading } = usePlayer();
  console.log('[DEBUG] Main render', { isLoading, player });
} 