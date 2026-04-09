# StellaMatch

StellaMatch is an AI-powered, gamified skill exchange platform for engineering students in the same city.

## Core Features
- JWT auth + bcrypt password security.
- Resume upload with MongoDB metadata tracking.
- Skill catalog with point values stored in MongoDB.
- GitHub metadata analysis + OpenAI enrichment.
- Matchmaking between complementary learners.
- Character hub with project grading, XP, and inventory.
- Stella points transfer ledger in MongoDB.
- Friend request + accept flow in MongoDB.
- Friends Hub with direct chat and embedded Jitsi video meet rooms for accepted friends.
- Skill Testing Arena quiz duels against friends with XP + Stella rewards and battle history.
- Leaderboard with sorting/filtering by XP, skill points, and Stella points.
- Activity logging for user actions.

## Docs
- [Privacy Policy](./PRIVACY_POLICY.md)
- [Terms and Conditions](./TERMS_AND_CONDITIONS.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## Run Locally
1. Copy `.env.example` and configure secrets.
2. Install dependencies: `npm install`
3. Seed dummy data (optional): `npm run seed:dummy`
4. Start server: `npm run dev` or `npm start`

## Docker
```bash
docker compose up --build
```

## Notes
- This project uses MongoDB for all app records (users, skills, friends, points, activity logs, matches, character data, resumes).


## Demo Data
- On low-data startups, demo users are auto-seeded for showcase pages.
- Demo password for seeded accounts: `demo1234`.
