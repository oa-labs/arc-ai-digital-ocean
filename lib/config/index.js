/**
 * Default configuration values
 */
const defaultConfig = {
    agent: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
        organization: process.env.OPENAI_ORGANIZATION,
    },
    environment: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === '1',
};
/**
 * Current configuration instance
 */
let currentConfig = { ...defaultConfig };
/**
 * Get the current configuration
 */
export function getConfig() {
    return { ...currentConfig };
}
/**
 * Update the configuration
 */
export function updateConfig(updates) {
    currentConfig = {
        ...currentConfig,
        ...updates,
        agent: {
            ...currentConfig.agent,
            ...updates.agent,
        },
    };
}
/**
 * Reset configuration to defaults
 */
export function resetConfig() {
    currentConfig = { ...defaultConfig };
}
/**
 * Validate that required configuration is present
 */
export function validateConfig() {
    const errors = [];
    if (!currentConfig.agent.apiKey) {
        errors.push('OPENAI_API_KEY is required');
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
