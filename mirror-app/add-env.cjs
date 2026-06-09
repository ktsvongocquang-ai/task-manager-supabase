const { execSync } = require('child_process');

const envs = [
  { name: 'VITE_SUPABASE_URL', value: 'https://yiuokvszyaqqjksshybn.supabase.co' },
  { name: 'VITE_SUPABASE_ANON_KEY', value: 'sb_publishable_-MePkqVIFqX6lyS9Yw3uxQ_6FWzXem1' },
  { name: 'GEMINI_API_KEY', value: 'AIzaSyDTzDPXA9m53vKT3x1y-jHOLrIafzFuj9Q' }
];

for (const env of envs) {
  console.log(`Adding ${env.name}...`);
  try {
    execSync(`npx vercel env add ${env.name} production,preview,development`, {
      input: env.value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
  } catch (e) {
    console.error(`Failed to add ${env.name}`);
  }
}
console.log('Deploying to production...');
try {
  execSync('npx vercel --prod --yes', { stdio: 'inherit' });
} catch (e) {
  console.error('Failed to deploy');
}
