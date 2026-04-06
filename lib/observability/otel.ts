/**
 * LuminaClean v5.0 - OpenTelemetry Configuration
 * Distributed tracing for CRO operations
 */

export const OTEL_CONFIG = {
  serviceName: 'lumina-clean-cro',
  serviceVersion: '5.0.0',
  environment: process.env.NODE_ENV || 'development',

  // Tracing
  tracing: {
    enabled: true,
    sampleRate: 1.0, // 100% sampling in production
    attributes: {
      'service.name': 'lumina-clean-cro',
      'deployment.environment': process.env.NODE_ENV || 'development',
      'team': 'growth',
    },
  },

  // Metrics
  metrics: {
    enabled: true,
    pushInterval: 15000, // 15 seconds
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
  },

  // Exporters
  exporters: {
    otlp: {
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
      headers: {
        'x-otlp-api-key': process.env.OTLP_API_KEY || '',
      },
    },
    console: process.env.NODE_ENV === 'development',
  },

  // CRO-specific spans
  croSpans: {
    mctsOptimization: {
      name: 'cro.mcts.optimization',
      attributes: ['region', 'simulations', 'variants_tested', 'best_lift'],
    },
    totAnalysis: {
      name: 'cro.tot.analysis',
      attributes: ['region', 'paths_evaluated', 'recommendations'],
    },
    variantDeploy: {
      name: 'cro.variant.deploy',
      attributes: ['variant_id', 'region', 'confidence', 'auto_deploy'],
    },
    variantRollback: {
      name: 'cro.variant.rollback',
      attributes: ['variant_id', 'region', 'reason'],
    },
    complianceCheck: {
      name: 'cro.compliance.check',
      attributes: ['variant_id', 'compliant', 'issues'],
    },
  },

  // CRO-specific metrics
  croMetrics: {
    conversionRate: {
      name: 'cro.conversion_rate',
      description: 'Current conversion rate by region',
      unit: 'ratio',
      labels: ['region'],
    },
    mctsScore: {
      name: 'cro.mcts_score',
      description: 'MCTS optimization score',
      unit: 'score',
      labels: ['variant_id', 'region'],
    },
    deployLatency: {
      name: 'cro.deploy_latency',
      description: 'Time to deploy a variant',
      unit: 'ms',
      labels: ['variant_id', 'site'],
    },
    experimentCount: {
      name: 'cro.experiment_count',
      description: 'Total number of active experiments',
      unit: 'count',
      labels: ['region'],
    },
  },
};

// Span helper
export function startCROSpan(name: string, attributes: Record<string, string | number | boolean>) {
  const span = {
    name,
    attributes,
    startTime: Date.now(),
    end() {
      const duration = Date.now() - this.startTime;
      console.log(`[OTEL] Span: ${name} — ${duration}ms`, attributes);
    },
  };
  return span;
}

export default OTEL_CONFIG;
