// Temporarily disabled - stub for AI prompts
export const generateStoryPrompt = (
  templateKey: string,
  context: any,
  additionalContext?: any
): string => {
  console.log('Story prompt generation temporarily disabled', {
    templateKey,
    context,
    additionalContext,
  });
  return 'Story generation temporarily disabled';
};

export const validatePrompt = (prompt: string): boolean => {
  console.log('Prompt validation temporarily disabled', { prompt });
  return true;
};

export const sanitizePrompt = (prompt: string): string => {
  console.log('Prompt sanitization temporarily disabled', { prompt });
  return prompt;
};
