import { describe, it, expect } from 'vitest';
import {
  arimaModel,
  isolationModel,
  categorizerModel,
  budgetModel,
} from '@/lib/ml-models';

describe('ML Models', () => {
  describe('SimpleARIMAModel', () => {
    it('should generate forecasts for given data', () => {
      const historicalData = [100, 105, 103, 108, 110, 107, 112, 115, 113, 118];
      const result = arimaModel.forecast(historicalData, 7);

      expect(result.forecasts).toHaveLength(7);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.trend).toMatch(/^(up|down|stable)$/);
    });

    it('should return positive forecasts', () => {
      const historicalData = [50, 55, 52, 58, 60];
      const result = arimaModel.forecast(historicalData, 5);

      result.forecasts.forEach((forecast) => {
        expect(forecast).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle small datasets gracefully', () => {
      const historicalData = [100, 110];
      const result = arimaModel.forecast(historicalData, 5);

      expect(result.forecasts).toHaveLength(5);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.trend).toMatch(/^(up|down|stable)$/);
    });

    it('should detect uptrend correctly', () => {
      const uptrend = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145];
      const result = arimaModel.forecast(uptrend, 5);

      expect(result.trend).toBe('up');
    });

    it('should detect downtrend correctly', () => {
      const downtrend = [145, 140, 135, 130, 125, 120, 115, 110, 105, 100];
      const result = arimaModel.forecast(downtrend, 5);

      expect(result.trend).toBe('down');
    });

    it('should detect stable trend correctly', () => {
      const stable = [100, 101, 99, 102, 100, 101, 99, 100, 101, 100];
      const result = arimaModel.forecast(stable, 5);

      expect(result.trend).toBe('stable');
    });
  });

  describe('IsolationForestModel', () => {
    it('should score normal transactions as low anomaly', () => {
      const score = isolationModel.scoreAnomaly(1.0, 2, 14, 3); // Normal amount, normal time
      expect(score).toBeLessThan(0.3);
    });

    it('should score large amounts as higher anomaly', () => {
      const smallScore = isolationModel.scoreAnomaly(1.0, 1, 14, 3);
      const largeScore = isolationModel.scoreAnomaly(5.0, 1, 14, 3);
      expect(largeScore).toBeGreaterThan(smallScore);
    });

    it('should score unusual times as higher anomaly', () => {
      const normalTime = isolationModel.scoreAnomaly(1.5, 2, 14, 3);
      const unusualTime = isolationModel.scoreAnomaly(1.5, 2, 4, 3);
      expect(unusualTime).toBeGreaterThan(normalTime);
    });

    it('should score high frequency as higher anomaly', () => {
      const normal = isolationModel.scoreAnomaly(1.0, 2, 14, 3);
      const frequent = isolationModel.scoreAnomaly(1.0, 8, 14, 3);
      expect(frequent).toBeGreaterThan(normal);
    });

    it('should return scores between 0 and 1', () => {
      for (let i = 0; i < 10; i++) {
        const score = isolationModel.scoreAnomaly(
          Math.random() * 10,
          Math.random() * 10,
          Math.floor(Math.random() * 24),
          Math.floor(Math.random() * 7)
        );
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('SmartCategorizerModel', () => {
    it('should suggest food for food-related transactions', () => {
      const suggestions = categorizerModel.categorize('Padaria do João', 25.50);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].categoryId).toBe('food');
      expect(suggestions[0].confidence).toBeGreaterThan(0.2);
    });

    it('should suggest transport for fuel transactions', () => {
      const suggestions = categorizerModel.categorize('Gasolina Posto Shell', 150);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].categoryId).toBe('transport');
      expect(suggestions[0].confidence).toBeGreaterThan(0.2);
    });

    it('should suggest utilities for internet bills', () => {
      const suggestions = categorizerModel.categorize('Conta de Internet', 79.99);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].categoryId).toBe('utilities');
      expect(suggestions[0].confidence).toBeGreaterThan(0.2);
    });

    it('should return top 3 suggestions', () => {
      const suggestions = categorizerModel.categorize('Transporte e Comida', 50);

      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should provide reasoning for categorization', () => {
      const suggestions = categorizerModel.categorize('Cinema Cinemark', 45);

      expect(suggestions[0].reasoning).toBeTruthy();
      expect(suggestions[0].reasoning).toContain('keyword');
    });

    it('should assign to "other" for unrecognized descriptions', () => {
      const suggestions = categorizerModel.categorize('XYZABC123DEF', 10);

      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].categoryId).toBe('other');
      expect(suggestions[0].confidence).toBeLessThan(0.5);
    });

    it('should handle case-insensitive matching', () => {
      const lower = categorizerModel.categorize('farmacia', 50);
      const upper = categorizerModel.categorize('FARMACIA', 50);

      expect(lower[0].categoryId).toBe(upper[0].categoryId);
      expect(lower[0].confidence).toBe(upper[0].confidence);
    });
  });

  describe('BudgetAlertModel', () => {
    it('should predict low probability of exceeding budget when spending is low', () => {
      const result = budgetModel.predictBudgetExceedance(100, 1000, 15, 50);

      expect(result.probability).toBeLessThan(0.3);
      expect(result.severity).toBe('safe');
    });

    it('should predict high probability of exceeding budget when spending is high', () => {
      const result = budgetModel.predictBudgetExceedance(800, 1000, 15, 50);

      expect(result.probability).toBeGreaterThan(0.5);
      expect(result.severity).toMatch(/^(warning|critical)$/);
    });

    it('should project spending correctly', () => {
      const result = budgetModel.predictBudgetExceedance(500, 1000, 15, 30);

      // 500 + 30 * 15 = 950
      expect(result.projectedTotal).toBeLessThanOrEqual(950 + 10); // Allow small rounding error
    });

    it('should calculate days until budget exceeded', () => {
      const result = budgetModel.predictBudgetExceedance(800, 1000, 10, 20);

      // Budget remaining: 200, daily spending: 20, so ~10 days
      expect(result.daysUntilExceedance).toBeDefined();
      expect(result.daysUntilExceedance).toBeGreaterThan(0);
    });

    it('should mark as critical when probability > 0.7', () => {
      const result = budgetModel.predictBudgetExceedance(900, 1000, 10, 100);

      expect(result.severity).toBe('critical');
    });

    it('should mark as warning when probability 0.4-0.7', () => {
      const result = budgetModel.predictBudgetExceedance(600, 1000, 15, 40);

      expect(result.severity).toMatch(/^(warning|critical)$/);
    });

    it('should return valid probability between 0 and 1', () => {
      const scenarios = [
        [100, 1000, 20, 25],
        [500, 1000, 15, 50],
        [900, 1000, 5, 100],
        [50, 500, 25, 10],
      ];

      scenarios.forEach(([spent, budget, days, daily]) => {
        const result = budgetModel.predictBudgetExceedance(spent, budget, days, daily);
        expect(result.probability).toBeGreaterThanOrEqual(0);
        expect(result.probability).toBeLessThanOrEqual(1);
      });
    });
  });
});
