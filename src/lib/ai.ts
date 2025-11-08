import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIAnalysisResult {
  summary: string;
  suggestedTags: string[];
  category?: string;
  keyPoints?: string[];
}

/**
 * Analyze content using Claude AI to generate smart tags and summary
 */
export async function analyzeContentWithAI(
  content: string,
  contentType: string,
  url?: string
): Promise<AIAnalysisResult> {
  try {
    const prompt = `Analyze this ${contentType} content and provide:
1. A brief 2-3 sentence summary
2. 3-5 relevant tags/keywords
3. 2-3 key points or takeaways

Content: ${content.substring(0, 3000)}
${url ? `URL: ${url}` : ''}

Respond in JSON format:
{
  "summary": "...",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "keyPoints": ["point1", "point2"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        summary: result.summary || '',
        suggestedTags: result.suggestedTags || [],
        keyPoints: result.keyPoints || [],
        category: contentType,
      };
    }

    // Fallback if JSON parsing fails
    return {
      summary: responseText.substring(0, 200),
      suggestedTags: [],
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return empty result on error
    return {
      summary: '',
      suggestedTags: [],
    };
  }
}

/**
 * Generate smart tags from title and content using AI
 * Always called dynamically - no hardcoded tags
 */
export async function generateSmartTags(
  title: string,
  content: string,
  url?: string
): Promise<string[]> {
  try {
    const prompt = `Analyze this content and extract 3-5 relevant, specific keywords or tags.

Rules:
- Tags should be concise (1-2 words max)
- Focus on main topics, technologies, categories, or key concepts
- Prioritize specificity over generic terms
- Use lowercase for consistency
- Return tags that would help in searching/organizing

Title: ${title}
Content: ${content.substring(0, 2000)}
${url ? `URL: ${url}` : ''}

Examples of good tags:
- "javascript", "react", "tutorial"
- "machine-learning", "python", "ai"
- "shopping", "electronics", "deals"
- "recipe", "cooking", "italian"

Return ONLY a JSON array of tags (no explanation):
["tag1", "tag2", "tag3"]`;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
    
    if (jsonMatch) {
      const tags = JSON.parse(jsonMatch[0]);
      // Clean and validate tags
      const cleanedTags = tags
        .filter((tag: string) => tag && tag.length > 0)
        .map((tag: string) => tag.toLowerCase().trim())
        .filter((tag: string) => tag.length >= 2 && tag.length <= 30)
        .slice(0, 5); // Limit to 5 tags
      
      console.log(`🏷️ Generated tags: ${cleanedTags.join(', ')}`);
      return cleanedTags;
    }

    console.warn('⚠️ Could not extract tags from AI response');
    return [];
  } catch (error) {
    console.error('❌ Tag generation error:', error);
    return [];
  }
}
