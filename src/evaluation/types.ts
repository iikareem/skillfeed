/**
 * Evaluation provider contract.
 * Ranking code depends on this — never on Vercel AI SDK imports.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type EvaluationState =
  | string
  | { [key: string]: JsonValue }
  | JsonValue[];

export type ScoreQuestion = {
  type: "score";
  instructions: EvaluationState;
  criteria: Array<EvaluationState | null>;
};

export type BooleanQuestion = {
  type: "boolean";
  instructions: EvaluationState;
  criteria?: {
    true?: EvaluationState | null;
    false?: EvaluationState | null;
  };
};

export type ChoiceQuestion = {
  type: "choice";
  instructions: EvaluationState;
  criteria: Record<string, EvaluationState | null>;
};

export type EvaluationQuestion =
  | ScoreQuestion
  | BooleanQuestion
  | ChoiceQuestion;

export type ScoreAnswer = {
  type: "score";
  score: number;
  probabilities?: Record<string, number>;
};

export type BooleanAnswer = {
  type: "boolean";
  probability: number;
};

export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities?: Record<string, number>;
};

export type EvaluationAnswer = ScoreAnswer | BooleanAnswer | ChoiceAnswer;

export type EvaluationUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type EvaluateRequest = {
  state: EvaluationState;
  questions: Record<string, EvaluationQuestion>;
};

export type EvaluateResponse = {
  answers: Record<string, EvaluationAnswer>;
  usage: EvaluationUsage;
  provider: string;
  modelId: string | null;
  raw?: unknown;
};

export interface EvaluationProvider {
  readonly id: string;
  evaluate(request: EvaluateRequest): Promise<EvaluateResponse>;
}

export type EvaluationProviderId = "vercel-gateway";
