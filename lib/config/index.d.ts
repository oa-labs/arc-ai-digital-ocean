import { AgentConfig } from '../types/index.js';
export interface SharedConfig {
    agent: AgentConfig;
    environment: 'development' | 'production' | 'test';
    debug: boolean;
}
/**
 * Get the current configuration
 */
export declare function getConfig(): SharedConfig;
/**
 * Update the configuration
 */
export declare function updateConfig(updates: Partial<SharedConfig>): void;
/**
 * Reset configuration to defaults
 */
export declare function resetConfig(): void;
/**
 * Validate that required configuration is present
 */
export declare function validateConfig(): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=index.d.ts.map