export const ASSESSMENT_TEMPLATE = {
  assessment: {
    title: 'My Assessment Title',
    description: 'Brief description of this assessment',
    version: 1,
    estimated_duration_minutes: 30,
    instructions:
      'Please rate each topic based on your current state and desired target.',
  },
  dimensions: [
    {
      dimension_key: 'dimension-1',
      title: 'First Dimension',
      description: 'Description of this dimension',
      category: 'Strategic',
      order_index: 1,
      topics: [
        {
          topic_key: 'topic-1-1',
          label: 'First Topic',
          prompt: 'How would you rate your organization on this topic?',
          order_index: 1,
          level_labels: [
            'No formal process exists, activities are ad-hoc',
            'Basic awareness exists but implementation is inconsistent',
            'Defined processes exist and are followed consistently',
            'Processes are measured and actively improved',
            'Best-in-class capability creating competitive advantage',
          ],
          recommendations: [
            {
              score_max: 2.5,
              gap_min: 0.5,
              title: 'Build Foundation',
              description: 'Establish basic practices for this area',
              why: 'Without foundational practices, progress will be unsustainable',
              what: 'Implement basic processes and assign clear ownership',
              how: '1. Assess current state\n2. Define basic processes\n3. Assign owner\n4. Document and communicate',
              action_items: [
                'Conduct current state assessment',
                'Define basic process documentation',
                'Assign topic owner',
                'Schedule monthly review',
              ],
              category: 'Quick Win',
              priority: 75,
              tags: ['foundation', 'process'],
            },
            {
              score_min: 2.5,
              score_max: 3.5,
              gap_min: 1.5,
              title: 'Advance Capability',
              description: 'Systematically develop this capability',
              why: 'Current level limits your competitive position',
              what: 'Implement structured improvement program',
              how: '1. Define target state\n2. Build roadmap\n3. Allocate resources\n4. Track progress',
              action_items: [
                'Define target state and success metrics',
                'Build 90-day improvement roadmap',
                'Allocate budget and team',
                'Establish monthly review cadence',
              ],
              category: 'Project',
              priority: 60,
              tags: ['capability', 'improvement'],
            },
            {
              target_min: 4.0,
              gap_min: 2.0,
              title: 'Transform to Leadership',
              description: 'Become an industry leader in this area',
              why: 'Your ambition requires transformational investment',
              what: 'Launch strategic transformation program',
              how: '1. Secure executive sponsorship\n2. Define transformation vision\n3. Build dedicated team\n4. Benchmark against leaders',
              action_items: [
                'Secure C-suite sponsorship and budget',
                'Define industry leadership vision',
                'Build or hire specialized team',
                'Establish innovation benchmarks',
              ],
              category: 'Big Bet',
              priority: 50,
              tags: ['transformation', 'leadership'],
            },
          ],
        },
      ],
    },
  ],
};

export function downloadTemplate() {
  const json = JSON.stringify(ASSESSMENT_TEMPLATE, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assessment-template.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
