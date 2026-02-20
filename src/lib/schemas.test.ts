import { describe, it, expect } from 'vitest';
import {
  interSyncSchema,
  transactionSchema,
  categorySchema,
  fixedCostSchema,
  dashboardQuerySchema,
} from './schemas';

describe('Zod Validation Schemas', () => {
  describe('interSyncSchema', () => {
    it('deve validar datas válidas', () => {
      const valid = {
        dataInicio: '2026-01-01',
        dataFim: '2026-02-20',
      };
      expect(() => interSyncSchema.parse(valid)).not.toThrow();
    });


    it('deve rejeitar formato de data incorreto', () => {
      const invalid = {
        dataInicio: '01/01/2026',
        dataFim: '2026-02-20',
      };
      expect(() => interSyncSchema.parse(invalid)).toThrow();
    });
  });

  describe('transactionSchema', () => {
    it('deve validar transação completa', () => {
      const valid = {
        date: new Date().toISOString(),
        description: 'Pagamento de conta',
        amount: 100.50,
        type: 'pix_sent' as const,
      };
      expect(() => transactionSchema.parse(valid)).not.toThrow();
    });

    it('deve rejeitar tipo inválido', () => {
      const invalid = {
        date: new Date().toISOString(),
        description: 'Test',
        amount: 100,
        type: 'invalid_type',
      };
      expect(() => transactionSchema.parse(invalid)).toThrow();
    });

    it('deve rejeitar amount não-numérico', () => {
      const invalid = {
        date: new Date().toISOString(),
        description: 'Test',
        amount: 'not-a-number',
        type: 'pix_sent',
      };
      expect(() => transactionSchema.parse(invalid)).toThrow();
    });

    it('deve validar todos os tipos válidos', () => {
      const validTypes = ['pix_sent', 'pix_received', 'payment', 'application', 'tax', 'other'];

      validTypes.forEach((type) => {
        const data = {
          date: new Date().toISOString(),
          description: 'Test',
          amount: 50,
          type,
        };
        expect(() => transactionSchema.parse(data)).not.toThrow();
      });
    });

    it('deve permitir categoryId opcional', () => {
      const valid = {
        date: new Date().toISOString(),
        description: 'Test',
        amount: 50,
        type: 'pix_sent' as const,
        categoryId: 'cat-123',
      };
      expect(() => transactionSchema.parse(valid)).not.toThrow();
    });
  });

  describe('categorySchema', () => {
    it('deve validar categoria com dados obrigatórios', () => {
      const valid = {
        name: 'Alimentação',
        color: '#FF5733',
        icon: 'utensils',
        type: 'expense' as const,
      };
      expect(() => categorySchema.parse(valid)).not.toThrow();
    });

    it('deve rejeitar type inválido', () => {
      const invalid = {
        name: 'Categoria',
        color: '#FF5733',
        icon: 'icon',
        type: 'invalid',
      };
      expect(() => categorySchema.parse(invalid)).toThrow();
    });

    it('deve validar cor em formato hex', () => {
      const valid = {
        name: 'Categoria',
        color: '#FF5733',
        icon: 'icon',
        type: 'expense' as const,
      };
      expect(() => categorySchema.parse(valid)).not.toThrow();
    });

    it('deve rejeitar cor inválida', () => {
      const invalid = {
        name: 'Categoria',
        color: 'not-a-color',
        icon: 'icon',
        type: 'expense',
      };
      expect(() => categorySchema.parse(invalid)).toThrow();
    });

    it('deve validar tipo income', () => {
      const valid = {
        name: 'Renda',
        color: '#00FF00',
        icon: 'income',
        type: 'income' as const,
      };
      expect(() => categorySchema.parse(valid)).not.toThrow();
    });
  });

  describe('fixedCostSchema', () => {
    it('deve validar custo fixo válido', () => {
      const valid = {
        name: 'Aluguel',
        amount: 1500,
        categoryId: 'cat-123',
        recurrence: 'monthly' as const,
      };
      expect(() => fixedCostSchema.parse(valid)).not.toThrow();
    });

    it('deve validar recorrências válidas', () => {
      const validRecurrences = ['monthly', 'annual', 'quarterly'];

      validRecurrences.forEach((recurrence) => {
        const data = {
          name: 'Custo',
          amount: 1000,
          categoryId: 'cat-123',
          recurrence,
        };
        expect(() => fixedCostSchema.parse(data)).not.toThrow();
      });
    });

    it('deve rejeitar amount negativo', () => {
      const invalid = {
        name: 'Custo',
        amount: -100,
        categoryId: 'cat-123',
        recurrence: 'monthly',
      };
      expect(() => fixedCostSchema.parse(invalid)).toThrow();
    });

    it('deve rejeitar recorrência inválida', () => {
      const invalid = {
        name: 'Custo',
        amount: 100,
        categoryId: 'cat-123',
        recurrence: 'invalid',
      };
      expect(() => fixedCostSchema.parse(invalid)).toThrow();
    });

    it('deve permitir categoryId obrigatório', () => {
      const valid = {
        name: 'Custo',
        amount: 100,
        categoryId: 'required-id',
        recurrence: 'monthly' as const,
      };
      expect(() => fixedCostSchema.parse(valid)).not.toThrow();
    });
  });

  describe('dashboardQuerySchema', () => {
    it('deve validar queries vazias', () => {
      expect(() => dashboardQuerySchema.parse({})).not.toThrow();
    });

    it('deve validar datas opcionais', () => {
      const valid = {
        startDate: '2026-01-01',
        endDate: '2026-02-20',
      };
      expect(() => dashboardQuerySchema.parse(valid)).not.toThrow();
    });

    it('deve permitir apenas startDate', () => {
      const valid = {
        startDate: '2026-01-01',
      };
      expect(() => dashboardQuerySchema.parse(valid)).not.toThrow();
    });

  });
});
