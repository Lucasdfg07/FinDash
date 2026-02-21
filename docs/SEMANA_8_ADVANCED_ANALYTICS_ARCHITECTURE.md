# 📊 Semana 8: Advanced Analytics Architecture

**Status:** Planning | **Date:** 2026-02-20 | **Target:** Predictive Dashboards + ML-Ready

---

## Executive Summary

Findash will implement **advanced analytics** enabling:

1. **Predictive Insights** - ML models for spending forecasts
2. **Trend Analysis** - Historical patterns & anomaly detection
3. **Smart Categorization** - Auto-classify transactions with confidence scores
4. **Budget Alerts** - Smart notifications based on ML predictions
5. **Comparative Analytics** - Compare spending vs historical averages
6. **Export & Reporting** - Data export for external analysis

**Architecture:** Analytics Engine (Node.js) → Inference API (Python/TensorFlow) → Database (time-series optimized)

---

## 1. Analytics Data Pipeline

```
┌─────────────────────────────────────────────────────┐
│            FINDASH ANALYTICS PIPELINE                │
└─────────────────────────────────────────────────────┘

Real-Time Data
    ↓
┌─────────────────┐
│  Event Stream   │ (WebSocket events from Semana 7)
└────────┬────────┘
         ↓
┌─────────────────────┐
│ Data Aggregator     │ (Time-series binning)
│ - Hourly summaries  │
│ - Daily summaries   │
│ - Weekly rolling    │
└────────┬────────────┘
         ↓
┌─────────────────────┐         ┌──────────────┐
│  TimescaleDB        │────────→│ ML Pipeline  │
│  (Time-Series DB)   │         │ (Predictions)│
└─────────────────────┘         └──────┬───────┘
                                       ↓
                                ┌──────────────┐
                                │ Cache Layer  │
                                │ (Redis)      │
                                └──────┬───────┘
                                       ↓
                                ┌──────────────┐
                                │ Analytics API│
                                │ (/api/stats)│
                                └──────────────┘
```

---

## 2. Advanced Analytics Features

### Feature 1: Predictive Spending

```typescript
// GET /api/analytics/forecast?days=30
interface SpendingForecast {
  categoryId: string;
  category: string;
  // Historical data
  historicalAvg: number;
  historicalStdDev: number;
  trend: 'up' | 'down' | 'stable';
  // Predictions
  predictedSpending: number;
  confidenceInterval: [min: number, max: number];
  confidenceScore: number; // 0-1
  // Insights
  likelihood: number; // Probability of exceeding budget
  recommendation: string;
}
```

**Implementation:**
- Use time-series model (ARIMA or Prophet)
- Train on 12 months historical data
- Update predictions weekly
- Cache predictions for 7 days

---

### Feature 2: Anomaly Detection

```typescript
// GET /api/analytics/anomalies
interface AnomalyDetection {
  transactionId: string;
  date: Date;
  category: string;
  amount: number;
  anomalyScore: number; // 0-1
  reason: string; // "unusual_amount" | "unusual_frequency" | "unusual_pattern"
  expectedAmount: number;
  alerts: {
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }[];
}
```

**Algorithms:**
- Z-score for outlier detection
- Isolation Forest for multivariate anomalies
- Seasonal decomposition for pattern changes

---

### Feature 3: Smart Categorization

```typescript
// POST /api/analytics/categorize
interface AutoCategorization {
  transactionId: string;
  description: string;
  amount: number;
  // Current category (if any)
  currentCategoryId?: string;
  // ML suggestions
  suggestions: Array<{
    categoryId: string;
    categoryName: string;
    confidence: number; // 0-1
    reasoning: string;
  }>;
  // Auto-apply threshold
  autoApplied: boolean;
  autoApplyThreshold: number; // Default 0.95
}
```

**Models:**
- NLP classification (title + amount → category)
- Reinforcement learning from user corrections
- Contextual awareness (time of day, merchant type)

---

### Feature 3: Comparative Analytics

```typescript
// GET /api/analytics/compare?period=month&compare=previous
interface ComparativeMetrics {
  period: {
    startDate: Date;
    endDate: Date;
    totalSpent: number;
    byCategory: Array<{
      categoryId: string;
      amount: number;
      percentage: number;
    }>;
  };
  previous: {
    startDate: Date;
    endDate: Date;
    totalSpent: number;
    byCategory: Array<{
      categoryId: string;
      amount: number;
      percentage: number;
    }>;
  };
  changes: {
    totalChange: number; // percentage
    byCategory: Array<{
      categoryId: string;
      change: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  insights: string[];
}
```

---

### Feature 4: Budget Smart Alerts

```typescript
// Smart alert system based on ML predictions
interface SmartAlert {
  categoryId: string;
  alertType: 'approaching_budget' | 'unusual_spending' | 'trend_change';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
  //  Data-driven
  confidence: number;
  expectedBy: Date;
  historicalProbability: number;
}
```

**Logic:**
- Track spending velocity vs budget
- Predict if budget will be exceeded (with confidence)
- Alert before budget exceeded (not after)
- Learn alert preferences from user actions

---

## 3. Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Data Store** | TimescaleDB (PostgreSQL extension) | Time-series optimized, SQL queries |
| **ML Framework** | TensorFlow.js / Python | Browser + server-side inference |
| **Analytics Engine** | Apache Superset (optional) | Self-service analytics dashboards |
| **Cache** | Redis | Fast prediction serving |
| **Aggregation** | Node.js worker threads | Background time-series aggregation |
| **Export** | Apache Arrow + Parquet | Efficient columnar export |

---

## 4. Implementation Plan (4 Tasks)

### Task 1: Time-Series Database Setup
- Configure TimescaleDB extension in PostgreSQL
- Create hypertables for metrics
- Setup automatic data retention (keep 2 years)
- Create materialized views for common queries

**Files:**
- `prisma/migrations/[X]_add_timescaledb.sql`
- `src/lib/timescaledb.ts` (connection manager)
- `docs/TIMESCALEDB_SETUP.md`

**Duration:** 2 hours

---

### Task 2: Data Aggregation Pipeline
- Create background worker for time-series aggregation
- Implement hourly/daily/weekly rollups
- Setup cron jobs for scheduled aggregations
- Cache popular aggregates in Redis

**Files:**
- `src/lib/analytics-aggregator.ts` (core engine)
- `src/jobs/aggregate-metrics.ts` (cron job)
- `src/app/api/analytics/metrics/route.ts` (API)
- `tests/analytics/aggregation.test.ts`

**Duration:** 3 hours

---

### Task 3: ML Prediction Engine
- Build prediction models (ARIMA, Prophet alternatives)
- Implement anomaly detection (Z-score, Isolation Forest)
- Smart categorization (NLP + confidence scoring)
- Cache predictions for performance

**Files:**
- `src/lib/ml-models.ts` (model definitions)
- `src/lib/predictions.ts` (inference)
- `src/app/api/analytics/forecast/route.ts`
- `src/app/api/analytics/categorize/route.ts`
- `tests/analytics/ml-models.test.ts`

**Duration:** 4 hours

---

### Task 4: Analytics UI Components
- Predictive spending chart (with confidence intervals)
- Anomaly timeline (highlight unusual transactions)
- Comparative period selector
- Smart alerts dashboard
- Export functionality

**Files:**
- `src/components/analytics/ForecastChart.tsx`
- `src/components/analytics/AnomalyTimeline.tsx`
- `src/components/analytics/ComparativeMetrics.tsx`
- `src/components/analytics/SmartAlerts.tsx`
- `src/app/(dashboard)/analytics/page.tsx` (new route)
- `tests/analytics/components.test.tsx`

**Duration:** 3 hours

---

## 5. Data Model Extensions

### New Tables (Hypertables)
```sql
-- Time-series metrics
CREATE TABLE metrics.hourly_aggregates (
  time TIMESTAMPTZ NOT NULL,
  category_id UUID,
  user_id UUID,
  total_spent FLOAT8,
  transaction_count INT,
  avg_transaction FLOAT8,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
SELECT create_hypertable('metrics.hourly_aggregates', 'time', if_not_exists => TRUE);

-- Predictions cache
CREATE TABLE analytics.predictions (
  id UUID PRIMARY KEY DEFAULT cuid(),
  category_id UUID NOT NULL,
  prediction_date DATE NOT NULL,
  forecast_days INT NOT NULL,
  predicted_amount FLOAT8,
  confidence_score FLOAT8,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + '7 days'::interval
);

-- Anomalies detected
CREATE TABLE analytics.anomalies (
  id UUID PRIMARY KEY DEFAULT cuid(),
  transaction_id UUID NOT NULL,
  anomaly_score FLOAT8,
  reason TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  addressed BOOLEAN DEFAULT FALSE
);

-- Smart categorization suggestions
CREATE TABLE analytics.category_suggestions (
  id UUID PRIMARY KEY DEFAULT cuid(),
  transaction_id UUID NOT NULL,
  suggested_category_id UUID,
  confidence FLOAT8,
  user_accepted BOOLEAN DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. ML Models Deep Dive

### Model 1: Spending Forecasting
```
ARIMA(1,1,1) for univariate forecasting
OR
Prophet (Seasonal + Trend decomposition)

Input: Historical daily spending per category
Output: 30-day forecast with confidence intervals

Retrain: Weekly (automatic)
```

### Model 2: Anomaly Detection
```
Isolation Forest for multivariate detection:
- Input features:
  - Amount (normalized by category average)
  - Time of day
  - Day of week
  - Frequency (transactions per day)
  - Merchant type

Output: Anomaly score [0,1] + reason
```

### Model 3: Auto-Categorization
```
TensorFlow.js Text Classification:
- Input: Transaction description + amount
- Output: Category probabilities

Or fallback: Keyword matching + heuristics
- Merchant regex patterns
- Amount-based rules
- Time-based context
```

---

## 7. API Endpoints

### Analytics Core
```
GET  /api/analytics/summary - Overall metrics
GET  /api/analytics/metrics/{category} - Category metrics
GET  /api/analytics/forecast?days=30 - Spending forecast
GET  /api/analytics/anomalies - Detected anomalies
GET  /api/analytics/trends/{category} - Historical trends
GET  /api/analytics/compare?period=month - Period comparison
```

### Smart Features
```
POST /api/analytics/categorize - Auto-categorization
GET  /api/analytics/alerts - Smart alerts
POST /api/analytics/alert-acknowledge - Dismiss alert
GET  /api/analytics/insights - AI-generated insights
```

### Data Export
```
GET  /api/analytics/export/csv - CSV export
GET  /api/analytics/export/json - JSON export
GET  /api/analytics/export/parquet - Parquet export
```

---

## 8. Performance Strategy

### Caching
```
Predictions: 7-day cache (update weekly)
Metrics: 1-hour cache (real-time updates via WebSocket)
Anomalies: 24-hour cache (background detection)
Comparisons: On-demand, cached 1 hour
```

### Queries
```
Time-series queries optimized with:
- Chunk-based retrieval (TimescaleDB automatic)
- Compression (native TimescaleDB)
- Continuous aggregates (materialized views)
- Index strategies for common time ranges
```

### Background Jobs
```
Hourly: Aggregate metrics
Daily: Run predictions
Daily: Detect anomalies
Weekly: Retrain models
Monthly: Data retention cleanup
```

---

## 9. Security & Privacy

- ✅ All analytics scoped to authenticated user
- ✅ No raw transaction export (aggregated only)
- ✅ ML model predictions never stored with user ID
- ✅ Encrypted at-rest for sensitive metrics
- ✅ Rate limiting on analytics API endpoints

---

## 10. Testing Strategy

### Unit Tests
- Aggregation logic
- Prediction models
- Anomaly detection
- Categorization confidence scoring

### Integration Tests
- Data pipeline end-to-end
- ML model inference
- Cache invalidation
- API endpoints

### Performance Tests
- Query latency on 1M+ rows
- Model inference time < 100ms
- Aggregation job duration

---

## 11. Timeline

```
Semana 8: Advanced Analytics

Monday:
├─ Task 1: TimescaleDB setup (2h)
├─ Task 2: Data aggregation (3h)
└─ Testing (1h)

Tuesday:
├─ Task 3: ML models (4h)
├─ Task 4: UI components (3h)
└─ Integration testing (1h)

Wednesday:
├─ Performance optimization (2h)
├─ Documentation (1h)
└─ Final integration (1h)

TOTAL: 19 hours
```

---

## 12. Success Metrics

| Metric | Target |
|--------|--------|
| Forecast accuracy | > 85% MAPE |
| Anomaly precision | > 90% |
| Prediction latency | < 100ms |
| Model retraining time | < 5min |
| Cache hit rate | > 80% |
| API response time | < 200ms |

---

## 13. Dependencies to Add

```json
{
  "dependencies": {
    "timescaledb": "1.0.0",        // TS types for TimescaleDB
    "tensorflow": "^4.10.0",       // ML inference
    "simple-statistics": "^7.11.0" // Statistical functions
  },
  "devDependencies": {
    "@types/simple-statistics": "^7.0.0"
  }
}
```

---

## Próximos Passos

1. ✅ Architecture designed
2. → @dev implementa Tasks 1-4
3. → @qa valida analytics accuracy
4. → @devops push para GitHub

---

*Arquitetura desenhada por @architect Aria — Synkra AIOS v4.2*
