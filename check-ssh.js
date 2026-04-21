const { execSync } = require('child_process');

try {
  // Use sshpass or something? Windows doesn't have sshpass easily.
  // Actually, we can just use the user's browser or tell them to check.
} catch (e) {
  console.log(e);
}