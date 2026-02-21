/**
 * ML Models for Analytics
 * Prediction models, anomaly detection, and smart categorization
 */

/**
 * Simple ARIMA-like forecasting using exponential smoothing
 * Suitable for univariate time series (spending by category)
 */
export class SimpleARIMAModel {
  private alpha: number = 0.3; // Smoothing factor for level
  private beta: number = 0.2; // Smoothing factor for trend
  private gamma: number = 0.1; // Smoothing factor for seasonality
  private seasonLength: number = 7; // Weekly seasonality

  /**
   * Forecast next N periods using exponential smoothing
   * @param historicalData Array of historical values
   * @param forecastPeriods Number of periods to forecast
   * @returns Array of forecasted values with confidence intervals
   */
  forecast(historicalData: number[], forecastPeriods: number) {
    if (historicalData.length < this.seasonLength) {
      // Fallback to simple average if not enough data
      const avg = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      return {
        forecasts: Array(forecastPeriods).fill(avg),
        confidence: 0.6,
        trend: this.detectTrend(historicalData),
      };
    }

    // Initialize components
    let level = historicalData[0];
    let trend = (historicalData[1] - historicalData[0]) / this.seasonLength;
    const seasonal = this.estimateSeasonality(historicalData);

    const forecasts: number[] = [];

    // Generate forecasts
    for (let i = 1; i <= forecastPeriods; i++) {
      const forecast = level + i * trend + seasonal[(i - 1) % this.seasonLength];
      forecasts.push(Math.max(forecast, 0)); // Prevent negative forecasts

      // Update level and trend for next iteration
      if (i < historicalData.length) {
        const actual = historicalData[i];
        const prevLevel = level;
        level = this.alpha * actual + (1 - this.alpha) * (level + trend);
        trend = this.beta * (level - prevLevel) + (1 - this.beta) * trend;
      }
    }

    return {
      forecasts,
      confidence: this.calculateConfidence(historicalData),
      trend: this.detectTrend(historicalData),
    };
  }

  /**
   * Detect trend direction (up, down, stable)
   */
  private detectTrend(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.1) return 'up';
    if (secondAvg < firstAvg * 0.9) return 'down';
    return 'stable';
  }

  /**
   * Estimate seasonal components
   */
  private estimateSeasonality(data: number[]): number[] {
    const seasonal = new Array(this.seasonLength).fill(0);

    if (data.length >= this.seasonLength) {
      const avg = data.reduce((a, b) => a + b, 0) / data.length;

      for (let i = 0; i < Math.min(data.length, this.seasonLength); i++) {
        seasonal[i % this.seasonLength] = data[i] - avg;
      }
    }

    return seasonal;
  }

  /**
   * Calculate forecast confidence based on historical volatility
   */
  private calculateConfidence(data: number[]): number {
    if (data.length < 2) return 0.5;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    // High volatility = low confidence
    const cv = stdDev / (mean || 1); // Coefficient of variation
    const confidence = Math.max(0.4, Math.min(0.95, 1 - cv * 0.2));

    return Math.round(confidence * 100) / 100;
  }
}

/**
 * Anomaly Detection using Isolation Forest concept
 * Identifies unusual transactions based on multiple features
 */
export class IsolationForestModel {
  /**
   * Score anomaly probability (0-1) for a transaction
   * @param amount Transaction amount (normalized by category average)
   * @param frequency Transaction frequency in period
   * @param timeOfDay Hour of day (0-23)
   * @param dayOfWeek Day of week (0-6)
   * @returns Anomaly score (0=normal, 1=definite anomaly)
   */
  scoreAnomaly(
    amount: number,
    frequency: number,
    timeOfDay: number,
    dayOfWeek: number
  ): number {
    let score = 0;
    let factors = 0;

    // Factor 1: Amount deviation (most important)
    // Normalized: assume average transaction is 1.0
    if (amount > 3) {
      score += Math.min((amount - 3) / 10, 1); // Large unusual amount
      factors++;
    } else if (amount < 0.1) {
      score += 0.3; // Very small unusual amount
      factors++;
    }

    // Factor 2: Time of day (some times are unusual for transactions)
    const unusualHours = [2, 3, 4, 5]; // 2 AM - 5 AM
    if (unusualHours.includes(timeOfDay)) {
      score += 0.4;
      factors++;
    }

    // Factor 3: Frequency anomaly
    // Assume normal: 1 transaction per period, >3 is suspicious
    if (frequency > 5) {
      score += Math.min((frequency - 5) / 10, 0.5);
      factors++;
    }

    // Factor 4: Weekend vs weekday patterns
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    // Different rules could apply based on transaction type

    // Normalize score
    if (factors === 0) return 0;

    return Math.min(score / factors, 1);
  }
}

/**
 * Smart Categorization using keyword matching and heuristics
 * Fast, interpretable alternative to neural networks for production
 */
export class SmartCategorizerModel {
  private patterns: Map<string, string[]> = new Map([
    // Common expense categories with keywords
    ['food', ['mercado', 'restaurante', 'comida', 'padaria', 'pizza', 'delivery', 'ifood', 'uber']],
    ['transport', ['uber', 'taxi', 'metro', 'gasolina', 'estacionamento', 'bus', 'passagem']],
    ['entertainment', ['cinema', 'netflix', 'spotify', 'games', 'playstation', 'show']],
    ['utilities', ['energia', 'água', 'internet', 'telefone', 'celular', 'gás']],
    ['health', ['farmácia', 'médico', 'hospital', 'dentista', 'academia', 'saúde']],
    ['shopping', ['loja', 'vestuário', 'roupa', 'sapato', 'moda', 'mall']],
    ['subscriptions', ['assinatura', 'plano', 'inscrição', 'subscription', 'monthly']],
  ]);

  /**
   * Categorize transaction based on description and amount
   * @returns Object with category suggestions and confidence scores
   */
  categorize(
    description: string,
    amount: number
  ): Array<{
    categoryId: string;
    confidence: number;
    reasoning: string;
  }> {
    const normalized = description.toLowerCase().trim();
    const suggestions: Array<{
      categoryId: string;
      confidence: number;
      reasoning: string;
    }> = [];

    // Check keyword patterns
    for (const [category, keywords] of this.patterns) {
      const matches = keywords.filter((keyword) => normalized.includes(keyword)).length;

      if (matches > 0) {
        // Confidence based on match count and amount
        let confidence = Math.min(matches * 0.3, 0.95);

        // Boost confidence for exact matches
        if (keywords.some((kw) => normalized === kw)) {
          confidence = 0.98;
        }

        // Adjust based on amount reasonableness
        const isReasonableAmount = amount > 0 && amount < 100000; // Arbitrary bounds
        if (isReasonableAmount) {
          confidence = Math.min(confidence * 1.1, 0.99);
        }

        suggestions.push({
          categoryId: category,
          confidence: Math.round(confidence * 100) / 100,
          reasoning: `Matched keywords: ${keywords.filter((kw) => normalized.includes(kw)).join(', ')}`,
        });
      }
    }

    // Sort by confidence
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // If no matches, return generic suggestion
    if (suggestions.length === 0) {
      suggestions.push({
        categoryId: 'other',
        confidence: 0.3,
        reasoning: 'No keyword matches found, assigned to Other',
      });
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }
}

/**
 * Budget Alert Model
 * Predicts likelihood of exceeding budget based on current spending
 */
export class BudgetAlertModel {
  /**
   * Calculate probability of exceeding budget
   * @param currentSpent Current spending in period
   * @param budget Budget limit
   * @param daysRemaining Days left in period
   * @param historicalDaily Average daily spending
   * @returns Probability (0-1) of exceeding budget
   */
  predictBudgetExceedance(
    currentSpent: number,
    budget: number,
    daysRemaining: number,
    historicalDaily: number
  ): {
    probability: number;
    projectedTotal: number;
    daysUntilExceedance?: number;
    severity: 'safe' | 'warning' | 'critical';
  } {
    // Project spending based on daily average
    const projectedSpent = currentSpent + historicalDaily * daysRemaining;
    const projectedDaily = projectedSpent / (30 - daysRemaining + 1);

    // Calculate probability using logistic function
    // Higher spending relative to budget = higher probability
    const ratio = currentSpent / budget;
    const probability = 1 / (1 + Math.exp(-5 * (ratio - 0.5))); // Sigmoid function

    // Calculate days until budget exceeded at current rate
    let daysUntilExceedance: number | undefined;
    if (projectedDaily > 0) {
      const budgetRemaining = Math.max(0, budget - currentSpent);
      daysUntilExceedance = Math.floor(budgetRemaining / projectedDaily);
    }

    // Determine severity
    let severity: 'safe' | 'warning' | 'critical';
    if (probability > 0.7) {
      severity = 'critical';
    } else if (probability > 0.4) {
      severity = 'warning';
    } else {
      severity = 'safe';
    }

    return {
      probability: Math.round(probability * 100) / 100,
      projectedTotal: Math.round(projectedSpent * 100) / 100,
      daysUntilExceedance,
      severity,
    };
  }
}

// Export singleton instances
export const arimaModel = new SimpleARIMAModel();
export const isolationModel = new IsolationForestModel();
export const categorizerModel = new SmartCategorizerModel();
export const budgetModel = new BudgetAlertModel();
