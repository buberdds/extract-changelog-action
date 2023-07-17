const core = require('@actions/core');
const fs = require('fs');
const semver = require('semver');

try {
  const version = core.getInput('version');

  if (!version) {
    throw new Error(
      'Version argument is required in semver format (e.g. 2.4.0).'
    );
  }

  if (!semver.valid(version)) {
    throw new Error(`Invalid version: ${version}`);
  }

  if (!fs.existsSync('CHANGELOG.md')) {
    throw new Error('CHANGELOG.md file not found');
  }

  const changelog = fs.readFileSync('CHANGELOG.md', 'utf8');
  const lines = changelog.split('\n');
  let found = false;
  let markdown = '# Change Log\n\n';

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (found) {
        // Found the next version, exit the loop
        break;
      }

      if (line.startsWith(`## ${version}`)) {
        // Found the specified version, start extracting entries
        found = true;
      }
    }

    if (found) {
      const githubIssueLineRegex =
        /\[#[0-9]+\]\((https:\/\/github\.com\/[^/]+\/[^/]+\/issues\/[0-9]+)\)/;
      // line with a issue link starts with multiple whitespaces, but we need only one
      if (line.match(githubIssueLineRegex)) {
        markdown += ` ${line.trim()}`;
      } else {
        markdown += line;
      }

      // We don't want to add a newline after a title line or when the last char is comma
      markdown += `${line.startsWith('- ') || line.endsWith(',') ? '' : '\n'}`;
    }
  }
  core.setOutput('content', markdown);
} catch (error) {
  core.setFailed(error.message);
}
