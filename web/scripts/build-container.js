/* eslint-disable no-undef */
import { execSync } from 'child_process';
import fs from 'fs';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const semver = packageJson.version;
const shortHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();

const imageTag = `ghcr.io/oa-labs/ichat-kb-manager:${semver}-${shortHash}`;
console.log(`Building and pushing container: ${imageTag}`);
try {
  execSync(`cd .. && docker buildx build . -f web/Dockerfile -t ${imageTag} --platform linux/amd64`, { stdio: 'inherit' });
  execSync(`docker push ${imageTag}`, { stdio: 'inherit' });
} catch (error) {
  console.error(`Error building and pushing container: ${error.message}`);
  console.error('Please ensure GITHUB_USERNAME and GITHUB_TOKEN environment variables are set');
  console.error('and rebuild the devcontainer, or run: echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin');
  process.exit(1);
}
