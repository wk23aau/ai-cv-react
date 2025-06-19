import fs from 'fs/promises';
import path from 'path';

// Adjusted GA_CONFIG_PATH to be relative to the project root or a known base directory.
// Assuming this utility file is in backend/src/utils, to get to backend/ga_config.json:
const GA_CONFIG_PATH = path.join(__dirname, '../../ga_config.json');

export interface GaConfig {
  measurementId?: string;
  propertyId?: string;
}

export async function readGaConfig(): Promise<GaConfig> {
  try {
    const data = await fs.readFile(GA_CONFIG_PATH, 'utf-8');
    return JSON.parse(data) as GaConfig;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // If the file doesn't exist, return an empty config object
      return {};
    }
    // For other errors, re-throw to be handled by the caller
    console.error('Error reading GA config file:', error);
    throw new Error('Failed to read GA configuration file.');
  }
}

export async function writeGaConfig(config: GaConfig): Promise<void> {
  try {
    await fs.writeFile(GA_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error: any) {
    console.error('Error writing GA config file:', error);
    throw new Error('Failed to write GA configuration file.');
  }
}
