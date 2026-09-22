import { z } from 'zod';
import { AppError } from '../common/errors.js';

const text = (max = 5000) => z.string().trim().min(1).max(max);
const shortText = text(300);

const socialPostSchema = z.object({
  headline: shortText,
  caption: text(5000),
  cta: shortText,
  hashtags: z.array(text(100)).max(30),
  visualConcept: text(5000),
  platformMeta: z.object({
    charCount: z.number().int().nonnegative(),
    hashtagCount: z.number().int().nonnegative(),
    bestTimeToPost: text(120),
  }).strict(),
}).strict();

const adDesignSchema = z.object({
  headline: shortText,
  offer: text(1500),
  cta: shortText,
  visualConcept: text(5000),
}).strict();

const contentIdeaSchema = z.object({
  id: text(100),
  title: shortText,
  angle: text(1500),
  format: text(200),
  hook: text(1500),
  cta: shortText,
  visual: text(2000),
}).strict();

const contentIdeasSchema = z.object({
  ideas: z.array(contentIdeaSchema).length(5),
}).strict();

const campaignDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  date: text(120),
  platform: text(80),
  format: text(200),
  idea: text(1500),
  hook: text(1500),
  caption: text(5000),
  cta: shortText,
  designConcept: text(3000),
}).strict();

const campaignSchema = z.object({
  days: z.array(campaignDaySchema).length(7),
}).strict();

export const AI_OUTPUT_SCHEMAS = {
  'social-post': socialPostSchema,
  'ad-design': adDesignSchema,
  'content-ideas': contentIdeasSchema,
  campaign: campaignSchema,
};

const stringSchema = (description) => ({ type: 'string', description });

export const AI_OUTPUT_JSON_SCHEMAS = {
  'social-post': {
    type: 'object',
    additionalProperties: false,
    properties: {
      headline: stringSchema('Short publish-ready headline.'),
      caption: stringSchema('Complete platform-ready caption in the requested language.'),
      cta: stringSchema('Clear call to action.'),
      hashtags: {
        type: 'array',
        maxItems: 30,
        items: stringSchema('Relevant hashtag including the # prefix.'),
      },
      visualConcept: stringSchema('Practical visual direction for the creative.'),
      platformMeta: {
        type: 'object',
        additionalProperties: false,
        properties: {
          charCount: { type: 'integer', minimum: 0 },
          hashtagCount: { type: 'integer', minimum: 0 },
          bestTimeToPost: stringSchema('A concise suggested posting time.'),
        },
        required: ['charCount', 'hashtagCount', 'bestTimeToPost'],
      },
    },
    required: ['headline', 'caption', 'cta', 'hashtags', 'visualConcept', 'platformMeta'],
  },
  'ad-design': {
    type: 'object',
    additionalProperties: false,
    properties: {
      headline: stringSchema('Short advertising headline.'),
      offer: stringSchema('Concise offer or supporting message.'),
      cta: stringSchema('Clear call to action.'),
      visualConcept: stringSchema('Detailed art direction for the ad visual.'),
    },
    required: ['headline', 'offer', 'cta', 'visualConcept'],
  },
  'content-ideas': {
    type: 'object',
    additionalProperties: false,
    properties: {
      ideas: {
        type: 'array',
        minItems: 5,
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: stringSchema('Stable short identifier such as idea-1.'),
            title: stringSchema('Idea title.'),
            angle: stringSchema('Marketing angle.'),
            format: stringSchema('Recommended content format.'),
            hook: stringSchema('Opening hook.'),
            cta: stringSchema('Call to action.'),
            visual: stringSchema('Visual direction.'),
          },
          required: ['id', 'title', 'angle', 'format', 'hook', 'cta', 'visual'],
        },
      },
    },
    required: ['ideas'],
  },
  campaign: {
    type: 'object',
    additionalProperties: false,
    properties: {
      days: {
        type: 'array',
        minItems: 7,
        maxItems: 7,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            day: { type: 'integer', minimum: 1, maximum: 7 },
            date: stringSchema('Date or concise day label.'),
            platform: stringSchema('Requested social platform.'),
            format: stringSchema('Recommended content format.'),
            idea: stringSchema('Daily content idea.'),
            hook: stringSchema('Daily opening hook.'),
            caption: stringSchema('Publish-ready caption.'),
            cta: stringSchema('Daily call to action.'),
            designConcept: stringSchema('Daily visual/art direction.'),
          },
          required: ['day', 'date', 'platform', 'format', 'idea', 'hook', 'caption', 'cta', 'designConcept'],
        },
      },
    },
    required: ['days'],
  },
};

export function validateGeneratedContent(tool, generated) {
  const schema = AI_OUTPUT_SCHEMAS[tool];
  if (!schema) throw new AppError(500, 'AI_SCHEMA_NOT_FOUND', 'Generation schema is not configured');

  const parsed = schema.safeParse(generated);
  if (!parsed.success) {
    throw new AppError(502, 'AI_INVALID_RESPONSE', 'AI provider returned an invalid structured response');
  }
  return parsed.data;
}

export function jsonSchemaForTool(tool) {
  const schema = AI_OUTPUT_JSON_SCHEMAS[tool];
  if (!schema) throw new AppError(500, 'AI_SCHEMA_NOT_FOUND', 'Generation schema is not configured');
  return schema;
}
