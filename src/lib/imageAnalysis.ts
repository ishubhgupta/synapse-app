/**
 * Image Analysis with Claude Vision
 * Extracts OCR text, generates descriptions, detects objects, and suggests tags
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ImageAnalysisResult {
  ocrText: string;
  description: string;
  tags: string[];
  objects: string[];
  confidence: number;
}

/**
 * Analyze image using Claude Vision
 */
export async function analyzeImageWithClaude(
  imageUrl: string,
  surroundingContext?: string,
  altText?: string
): Promise<ImageAnalysisResult> {
  try {
    console.log('🔍 Analyzing image with Claude Vision...');

    const contextPrompt = [
      surroundingContext && `Surrounding text from page: "${surroundingContext}"`,
      altText && `Alt text: "${altText}"`,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `Analyze this image thoroughly and provide:

1. **OCR Text**: Extract ALL visible text from the image (even if it's handwritten, in screenshots, or watermarked)
2. **Description**: A clear 2-3 sentence description of what the image shows
3. **Tags**: 5-10 relevant keywords/tags for categorization and search
4. **Objects**: List of main objects, concepts, or elements visible in the image

${contextPrompt ? `\nContext:\n${contextPrompt}` : ''}

Return response in this EXACT JSON format (no markdown, no code blocks):
{
  "ocrText": "All extracted text here...",
  "description": "Clear description of the image...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "objects": ["object1", "object2", "object3"],
  "confidence": 0.95
}

Rules:
- ocrText: Include ALL text, maintain formatting if possible
- description: Be specific and descriptive
- tags: Lowercase, concise (1-2 words), relevant for search
- objects: Main subjects, themes, or concepts
- confidence: 0-1, how confident you are in the analysis`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022', // Latest model with vision
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and clean result
    const analysis: ImageAnalysisResult = {
      ocrText: result.ocrText || '',
      description: result.description || 'Image could not be analyzed',
      tags: (result.tags || [])
        .filter((tag: string) => tag && tag.length > 1)
        .map((tag: string) => tag.toLowerCase().trim())
        .slice(0, 10),
      objects: (result.objects || [])
        .filter((obj: string) => obj && obj.length > 1)
        .slice(0, 10),
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.8,
    };

    console.log('✅ Image analysis complete:');
    console.log(`   OCR text: ${analysis.ocrText.substring(0, 100)}${analysis.ocrText.length > 100 ? '...' : ''}`);
    console.log(`   Description: ${analysis.description}`);
    console.log(`   Tags: ${analysis.tags.join(', ')}`);
    console.log(`   Objects: ${analysis.objects.join(', ')}`);
    console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);

    return analysis;
  } catch (error) {
    console.error('❌ Image analysis failed:', error);

    // Return fallback result
    return {
      ocrText: '',
      description: 'Image analysis unavailable',
      tags: ['image'],
      objects: [],
      confidence: 0,
    };
  }
}

/**
 * Analyze image from base64 data
 */
export async function analyzeImageFromBase64(
  base64Data: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
  surroundingContext?: string,
  altText?: string
): Promise<ImageAnalysisResult> {
  try {
    console.log('🔍 Analyzing base64 image with Claude Vision...');

    const contextPrompt = [
      surroundingContext && `Surrounding text from page: "${surroundingContext}"`,
      altText && `Alt text: "${altText}"`,
    ]
      .filter(Boolean)
      .join('\n');

    const prompt = `Analyze this image thoroughly and provide:

1. **OCR Text**: Extract ALL visible text from the image
2. **Description**: A clear 2-3 sentence description of what the image shows
3. **Tags**: 5-10 relevant keywords/tags for categorization and search
4. **Objects**: List of main objects, concepts, or elements visible in the image

${contextPrompt ? `\nContext:\n${contextPrompt}` : ''}

Return response in this EXACT JSON format (no markdown, no code blocks):
{
  "ocrText": "All extracted text here...",
  "description": "Clear description of the image...",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "objects": ["object1", "object2", "object3"],
  "confidence": 0.95
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const result = JSON.parse(jsonMatch[0]);

    const analysis: ImageAnalysisResult = {
      ocrText: result.ocrText || '',
      description: result.description || 'Image could not be analyzed',
      tags: (result.tags || [])
        .filter((tag: string) => tag && tag.length > 1)
        .map((tag: string) => tag.toLowerCase().trim())
        .slice(0, 10),
      objects: (result.objects || [])
        .filter((obj: string) => obj && obj.length > 1)
        .slice(0, 10),
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.8,
    };

    console.log('✅ Base64 image analysis complete');
    return analysis;
  } catch (error) {
    console.error('❌ Base64 image analysis failed:', error);
    return {
      ocrText: '',
      description: 'Image analysis unavailable',
      tags: ['image'],
      objects: [],
      confidence: 0,
    };
  }
}

/**
 * Quick OCR-only extraction (faster, cheaper)
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307', // Cheaper model
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Extract all visible text from this image. Return only the text, nothing else.',
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    return '';
  } catch (error) {
    console.error('OCR extraction failed:', error);
    return '';
  }
}
