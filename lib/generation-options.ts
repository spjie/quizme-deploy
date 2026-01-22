export type BloomLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
export type LearningMode = 'fact-recall' | 'conceptual'
export type ReasoningDepth = 'single-step' | 'multi-step'
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5

export type GenerationOptions = {
  bloomLevel: BloomLevel
  learningMode: LearningMode
  examPrepMode: boolean
  reasoningDepth: ReasoningDepth
  difficultyLevel: DifficultyLevel
}

export const DEFAULT_GENERATION_OPTIONS: GenerationOptions = {
  bloomLevel: 'understand',
  learningMode: 'conceptual',
  examPrepMode: false,
  reasoningDepth: 'single-step',
  difficultyLevel: 3,
}

export const BLOOM_LEVELS: { value: BloomLevel; label: string; description: string }[] = [
  { value: 'remember', label: 'Remember', description: 'Recall facts and basic concepts' },
  { value: 'understand', label: 'Understand', description: 'Explain ideas or concepts' },
  { value: 'apply', label: 'Apply', description: 'Use information in new situations' },
  { value: 'analyze', label: 'Analyze', description: 'Draw connections among ideas' },
  { value: 'evaluate', label: 'Evaluate', description: 'Justify decisions or courses of action' },
  { value: 'create', label: 'Create', description: 'Produce new or original work' },
]

export function buildPromptWithOptions(
  basePrompt: string,
  options: GenerationOptions
): string {
  const constraints: string[] = []

  // Difficulty level constraint
  const difficultyDescriptions: Record<DifficultyLevel, string> = {
    1: 'VERY EASY - Basic recall and simple concepts. Questions should be straightforward and accessible to beginners. Avoid complexity.',
    2: 'EASY - Fundamental understanding with minimal challenge. Questions should be clear and direct with obvious answers.',
    3: 'MODERATE - Standard difficulty requiring solid understanding. Questions should be balanced between accessibility and challenge.',
    4: 'HARD - Advanced material requiring deeper analysis. Questions should challenge students and require careful thought.',
    5: 'VERY HARD - Expert-level complexity with intricate concepts. Questions should be highly challenging and require mastery of the subject.',
  }
  constraints.push(`DIFFICULTY LEVEL (${options.difficultyLevel}/5): ${difficultyDescriptions[options.difficultyLevel]}`)

  // Bloom's Taxonomy constraint
  const bloomDescriptions: Record<BloomLevel, string> = {
    remember: 'Focus on RECALL and RECOGNITION of facts, terms, basic concepts. Questions should test memorization (e.g., "What is...", "Define...", "List...").',
    understand: 'Focus on COMPREHENSION and EXPLANATION. Questions should test understanding of meaning (e.g., "Explain why...", "Describe how...", "Summarize...").',
    apply: 'Focus on APPLICATION of knowledge to new situations. Questions should require using concepts to solve problems (e.g., "Calculate...", "Demonstrate...", "Apply the formula...").',
    analyze: 'Focus on ANALYSIS and breaking down information. Questions should require identifying relationships, patterns, causes (e.g., "Compare...", "Analyze the relationship...", "What is the effect of...").',
    evaluate: 'Focus on EVALUATION and critical judgment. Questions should require making justified decisions (e.g., "Critique...", "Which approach is best and why...", "Evaluate the effectiveness...").',
    create: 'Focus on CREATION and synthesis of new ideas. Questions should require designing, constructing, planning (e.g., "Design a solution...", "Propose a new...", "Create a plan...").',
  }
  constraints.push(`BLOOM'S TAXONOMY LEVEL: ${bloomDescriptions[options.bloomLevel]}`)

  // Learning mode constraint
  if (options.learningMode === 'fact-recall') {
    constraints.push(
      'LEARNING MODE: Fact Recall - Questions should test direct recall of specific information, dates, names, definitions, formulas. Keep answers precise and factual.'
    )
  } else {
    constraints.push(
      'LEARNING MODE: Conceptual Understanding - Questions should test deeper understanding of WHY and HOW concepts work, their relationships, and underlying principles. Answers should explain reasoning and connections.'
    )
  }

  // Exam prep mode constraint
  if (options.examPrepMode) {
    constraints.push(
      'EXAM PREP MODE: Make questions MORE RIGOROUS and EXAM-STYLE. Use formal question formats, include multi-part questions where appropriate, and create PLAUSIBLE DISTRACTORS that represent common misconceptions. Questions should be challenging and test thorough understanding.'
    )
  }

  // Reasoning depth constraint
  if (options.reasoningDepth === 'single-step') {
    constraints.push(
      'REASONING DEPTH: Single-step reasoning - Each question should require ONE logical step or concept to answer. Keep questions focused and direct.'
    )
  } else {
    constraints.push(
      'REASONING DEPTH: Multi-step reasoning - Questions should require MULTIPLE logical steps, combining concepts, or chaining inferences. Include problems that need to synthesize information from different areas.'
    )
  }

  // Build the enhanced prompt
  const constraintsText = constraints.map((c, i) => `${i + 1}. ${c}`).join('\n\n')

  return `${basePrompt}

IMPORTANT GENERATION CONSTRAINTS:
${constraintsText}

These constraints MUST materially affect the difficulty, style, and cognitive level of ALL generated questions.`
}
