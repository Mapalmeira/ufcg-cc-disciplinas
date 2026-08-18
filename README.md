# UFCG Computer Science Curriculum

An interactive planner for exploring the 2023 Computer Science curriculum at the Federal University of Campina Grande. It brings courses, prerequisites, classes, and dependency relationships into one interface.

Data is fetched directly by the browser from sources supplied by or used by the Course Coordination. The production build is fully static and does not require a backend.

The public spreadsheets are read through the Google Visualization endpoint as CSV. This keeps the original row/column layout and does not require a Google Sheets API key.

## Official data sources

- [PPC 2023 course catalog](https://github.com/daltonserey/ppc-2023-em-dados/blob/master/dados/disciplinas.json): syllabus, hours, credits, and responsible academic units.
- [PPC 2023 curriculum matrix](https://docs.google.com/spreadsheets/d/1eMhue4891tuD8pUGYlB2fWpWXDtbGE2IEyNEgy28pHM/edit): period, category, tracks, prerequisites, and corequisites.
- [2026.2 class schedule](https://docs.google.com/spreadsheets/d/10kUHJNiyvzLC20LcIwiTdkDXkbAEy9mPUvr8gzwo688/edit): sections, instructors and rooms.

> Note: this project was developed with large language models (LLMs).

## Development

```bash
npm install
npm run dev
```

Use `npm run build` to create a production build. The static site ready for hosting is generated in `dist/client`.

## GitHub Pages

Pushes to `main` are built and deployed by `.github/workflows/pages.yml`.
