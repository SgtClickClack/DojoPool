import { UserProfile } from "../types/user";
import { TrainingSession } from "../types/training";

interface PromptTemplate {
  template: string;
  defaultParams: Record<string, any>;
}

interface StoryContext {
  userProfile: UserProfile;
  trainingSession: TrainingSession;
  currentSkillLevel: number;
  previousAchievements: string[];
}

const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  storyIntro: {
    template: `Create an engaging martial arts training story for a {skillLevel} practitioner.
Focus on {style} techniques and incorporate their recent achievement of {recentAchievement}.
The story should be motivational and include specific training goals.`,
    defaultParams: {
      skillLevel: "beginner",
      style: "general",
      recentAchievement: "starting their journey",
    },
  },

  challengePrompt: {
    template: `Design a training challenge for a {skillLevel} student in {style}.
The challenge should build upon their mastery of {previousTechnique}
and introduce {newTechnique} in an engaging way.
Include specific success criteria and safety considerations.`,
    defaultParams: {
      skillLevel: "beginner",
      style: "general",
      previousTechnique: "basic stance",
      newTechnique: "basic movement",
    },
  },

  feedbackPrompt: {
    template: `Provide constructive feedback for a {skillLevel} student's performance in {technique}.
Consider their previous experience with {relatedTechnique}
and suggest specific improvements while maintaining encouragement.`,
    defaultParams: {
      skillLevel: "beginner",
      technique: "basic technique",
      relatedTechnique: "fundamental movement",
    },
  },

  progressionPrompt: {
    template: `Create a progression plan for advancing from {currentLevel} to {targetLevel} in {style}.
Include key milestones, focusing on {focusArea}
and building upon {foundation}.`,
    defaultParams: {
      currentLevel: "beginner",
      targetLevel: "intermediate",
      style: "general",
      focusArea: "basic techniques",
      foundation: "stance and movement",
    },
  },
};

export function generateStoryPrompt(
  templateKey: keyof typeof PROMPT_TEMPLATES,
  context: StoryContext,
  additionalParams: Record<string, any> = {},
): string {
  const template = PROMPT_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  const params = {
    ...template.defaultParams,
    ...mapContextToParams(context),
    ...additionalParams,
  };

  return interpolateTemplate(template.template, params);
}

function mapContextToParams(context: StoryContext): Record<string, any> {
  return {
    skillLevel: mapSkillLevel(context.currentSkillLevel),
    recentAchievement:
      context.previousAchievements[0] || "starting their journey",
    style: context.userProfile.preferredStyle || "general",
  };
}

function mapSkillLevel(level: number): string {
  if (level < 3) return "beginner";
  if (level < 6) return "intermediate";
  if (level < 8) return "advanced";
  return "expert";
}

function interpolateTemplate(
  template: string,
  params: Record<string, any>,
): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}

export function validatePrompt(prompt: string): boolean {
  // Add validation logic here (e.g., length, content guidelines, etc.)
  const minLength = 50;
  const maxLength = 1000;

  if (prompt.length < minLength || prompt.length > maxLength) {
    return false;
  }

  // Add more validation rules as needed
  return true;
}

export function sanitizePrompt(prompt: string): string {
  // Add sanitization logic here (e.g., remove sensitive information, inappropriate content, etc.)
  return prompt
    .replace(/[^\w\s.,!?-]/g, "") // Remove special characters
    .trim();
}

export default {
  generateStoryPrompt,
  validatePrompt,
  sanitizePrompt,
};
