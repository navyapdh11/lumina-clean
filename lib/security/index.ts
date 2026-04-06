/**
 * LuminaClean v5.0 - Enterprise Security Index
 * Single import point for all security modules
 */

export { validateBashCommand, validateBatchCommands } from './bashValidators';
export type { PermissionResult } from './bashValidators';

export { ANTI_DISTILLATION_FLAG, injectDecoyRules, signConnectorText } from './antiDistillation';

export {
  getUndercoverInstructions,
  isInternalRepo,
  sanitizeCommitMessage,
  UNDERCOVER_ENABLED,
} from './undercover';

export {
  detectFrustration,
  shouldEscalateToHuman,
  getEmpathyTone,
} from '../telemetry/frustrationDetector';

export { BUILD_FLAGS, isFeatureEnabled, getEnabledFeatures } from '../config/buildFlags';

export {
  runFourPhaseAutoDream,
  shouldTriggerAutoDream,
} from '../daemon/autoDream';

export { kairosTickLoop } from '../daemon/kairosTickLoop';
