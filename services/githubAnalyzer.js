const OpenAI = require('openai');
const { computeSkillValue } = require('./skillValueEngine');

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function fetchGithubRepos(username) {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers });
  if (!res.ok) {
    throw new Error(`GitHub fetch failed (${res.status})`);
  }
  return res.json();
}

function extractRepoMetadata(repos = []) {
  const languageSet = new Set();
  const topics = new Set();
  let totalStars = 0;
  let totalForks = 0;
  let totalSize = 0;
  let recentActivityDays = 365;

  repos.forEach((repo) => {
    if (repo.language) languageSet.add(repo.language);
    (repo.topics || []).forEach((t) => topics.add(t));
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;
    totalSize += repo.size || 0;

    if (repo.pushed_at) {
      const days = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24));
      recentActivityDays = Math.min(recentActivityDays, Math.max(0, days));
    }
  });

  return {
    repoCount: repos.length,
    languages: [...languageSet],
    topics: [...topics],
    totalStars,
    totalForks,
    totalSize,
    recentActivityDays
  };
}

async function inferSkillsWithOpenAI(metadata) {
  if (!openai) {
    const baseline = computeSkillValue({
      repoCount: metadata.repoCount,
      totalStars: metadata.totalStars,
      languageCount: metadata.languages.length,
      recentActivityDays: metadata.recentActivityDays
    });
    return {
      skills: metadata.languages,
      skillValue: baseline.skillValue,
      level: baseline.level
    };
  }

  const prompt = [
    'Analyze this GitHub repository metadata and identify technical skills, frameworks, and experience level.',
    'Return structured JSON with skills list and proficiency score.',
    JSON.stringify(metadata)
  ].join('\n');

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are a strict JSON generator for developer skill analysis.' },
      { role: 'user', content: prompt }
    ]
  });

  const parsed = JSON.parse(response.choices[0].message.content || '{}');
  const engine = computeSkillValue({
    repoCount: metadata.repoCount,
    totalStars: metadata.totalStars,
    languageCount: metadata.languages.length,
    recentActivityDays: metadata.recentActivityDays
  });

  return {
    skills: Array.isArray(parsed.skills) ? parsed.skills : metadata.languages,
    skillValue: typeof parsed.skillValue === 'number' ? Math.max(0, Math.min(100, parsed.skillValue)) : engine.skillValue,
    level: parsed.level || engine.level
  };
}

async function analyzeGithub(username) {
  const repos = await fetchGithubRepos(username);
  const metadata = extractRepoMetadata(repos);
  const aiResult = await inferSkillsWithOpenAI(metadata);
  return {
    ...aiResult,
    metadata
  };
}

module.exports = {
  analyzeGithub
};
