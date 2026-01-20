export interface ErrorTestScenario {
    id: string;
    name: string;
    description: string;
    category: 'component' | 'network' | 'async' | 'permission' | 'memory';
    severity: 'low' | 'medium' | 'high' | 'critical';
    trigger: () => void;
}
