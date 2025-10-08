/* eslint-disable no-undef */
import { execSync } from 'child_process';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const semver = packageJson.version;
const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

const imageTag = `ghcr.io/oa-labs/ichat-kb-manager:${semver}-${shortHash}`;
console.log(`Building and pushing container: ${imageTag}`);

// Get additional arguments from command line
// Skip first two args (node executable and script path)
const additionalArgs = process.argv.slice(2);

console.log(`Additional build arguments: ${additionalArgs.length > 0 ? additionalArgs.join(' ') : 'none'}`);

try {
  // Build the docker command with additional arguments
  const buildArgs = additionalArgs.length > 0 ? ` ${additionalArgs.join(' ')}` : '';
  execSync(`cd .. && docker buildx build . -f web/Dockerfile -t ${imageTag} --platform linux/amd64${buildArgs}`, { stdio: 'inherit' });
  execSync(`docker push ${imageTag}`, { stdio: 'inherit' });
  console.log(`Container built and pushed: ${imageTag}`);
} catch (error) {
  console.error(`Error building and pushing container: ${error.message}`);
  console.error('Please ensure GITHUB_USERNAME and GITHUB_TOKEN environment variables are set');
  console.error('and rebuild the devcontainer, or run: echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin');
  process.exit(1);
}
