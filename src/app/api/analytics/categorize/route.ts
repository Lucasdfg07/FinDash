import { NextResponse } from 'next/server';
import { categorizerModel } from '@/lib/ml-models';
import { z } from 'zod';

/**
 * Auto-Categorization Request Schema
 */
const categorizationSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  threshold: z.number().min(0).max(1).default(0.7),
});

export type CategorizationRequest = z.infer<typeof categorizationSchema>;

/**
 * POST /api/analytics/categorize
 * Get smart category suggestions for a transaction
 *
 * Body:
 * {
 *   description: string
 *   amount: number
 *   threshold: number (default: 0.7) - minimum confidence to auto-apply
 * }
 *
 * Response:
 * {
 *   suggestions: Array<{
 *     categoryId: string
 *     confidence: number
 *     reasoning: string
 *   }>
 *   autoApplied: boolean
 *   autoApplyThreshold: number
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request
    const validated = categorizationSchema.parse(body);
    const { description, amount, threshold } = validated;

    // Get category suggestions
    const suggestions = categorizerModel.categorize(description, amount);

    // Check if any suggestion exceeds auto-apply threshold
    const autoApplied = suggestions.length > 0 && suggestions[0].confidence >= threshold;

    return NextResponse.json({
      suggestions,
      autoApplied,
      autoApplyThreshold: threshold,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error('Error in categorization:', error);
    return NextResponse.json(
      { error: 'Failed to categorize transaction' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/categorize/patterns
 * Get available category patterns (for debugging/UI)
 */
export async function GET() {
  try {
    // Return available categories and patterns
    const patterns = [
      'food',
      'transport',
      'entertainment',
      'utilities',
      'health',
      'shopping',
      'subscriptions',
      'other',
    ];

    return NextResponse.json({
      availableCategories: patterns,
      description: 'Smart categorization uses keyword matching on transaction descriptions',
      confidenceThreshold: 0.7,
    });
  } catch (error) {
    console.error('Error fetching categorization patterns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}
