# TalentAI - Explainable AI Hiring Intelligence

A comprehensive enterprise SaaS platform that leverages artificial intelligence to help recruiters and administrators intelligently source, parse, rank, and evaluate candidates against job postings using LLM-driven semantic matching and explainable scoring.

## Quick Start

### Prerequisites
- Node.js 22.13.0+
- pnpm 10.4.1+
- MySQL/TiDB database

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start
```

The application will be available at `http://localhost:3000`

## Features

### 🔐 Authentication & Access Control
- JWT-based authentication with Manus OAuth 2.0
- Role-based access control (Admin and Recruiter roles)
- Secure session management with encrypted cookies
- Protected routes enforced per user role

### 📊 Enterprise Dashboard
- Real-time KPI cards showing Total Candidates, Total Jobs, AI Matches, Interviews, and Hiring Rate
- Recent activity feed with system events
- Quick action buttons for common tasks
- Professional light theme with responsive design

### 💼 Job Management
- Create, edit, delete, and publish job postings
- Full job description and requirements storage
- Job status tracking (draft, published, closed)
- Recruiter-specific job management interface

### 📄 Resume Upload & AI Parsing
- Support for PDF and DOCX file formats
- Bulk upload capability with drag-and-drop interface
- Upload progress indicators
- AI-powered automatic extraction of:
  - Technical and soft skills with proficiency levels
  - Work experience and employment history
  - Education and academic credentials
  - Professional certifications
  - Languages and achievements

### 🤖 AI Ranking Engine
- Semantic similarity scoring using LLM embeddings
- Weighted scoring model with exact specifications:
  - Skills: 40%
  - Experience: 25%
  - Projects: 15%
  - Education: 10%
  - Certifications: 5%
  - Activity: 5%
- Intelligent candidate-to-job matching

### 💡 Explainable AI Recommendations
- Detailed per-candidate match analysis
- Matched and missing skills identification
- AI-identified strengths and weaknesses
- Skill gap analysis
- AI-generated interview questions tailored to each candidate
- Comprehensive hiring recommendations

### 👥 Candidate Management
- Comprehensive candidate profiles with extracted resume data
- Career timeline visualization
- Skills showcase with proficiency levels
- Education and certification display
- AI-generated candidate summaries
- AI match scores displayed on profiles

### 🔍 Advanced Search & Filtering
- Multi-criteria filtering by skills, experience, education, score, location, and status
- Real-time search functionality
- Sortable and paginated candidate table
- Filter combinations for precise candidate targeting

### 📈 Analytics Dashboard
- Interactive data visualizations including:
  - Hiring funnel (Applied → Screened → Interviewed → Offered → Hired)
  - Top skills distribution
  - Candidate score distribution by AI match percentage
  - Experience level distribution
  - Monthly hiring trends
- Key performance metrics:
  - Conversion rate (Applied → Hired)
  - Average time to hire
  - Interview pass rate
- Excel and PDF export capabilities

## Project Structure

```
talent-ai/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # tRPC client and utilities
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom React hooks
│   │   └── index.css         # Global styles
│   └── public/               # Static assets
├── server/                    # Express backend
│   ├── routers.ts            # tRPC procedure definitions
│   ├── db.ts                 # Database queries
│   ├── rankingEngine.ts      # AI ranking logic
│   ├── interviewGenerator.ts # Interview question generation
│   ├── storage.ts            # S3 file storage helpers
│   └── _core/                # Framework core files
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts             # Drizzle ORM schema
│   └── migrations/           # SQL migration files
├── shared/                    # Shared types and constants
└── package.json              # Project dependencies
```

## Database Schema

The platform uses a comprehensive relational database with 14 tables:

**Core Tables:** users, jobs, candidates, resumes

**Candidate Profile Tables:** skills, experience, education, projects, certifications, languages, achievements

**AI & Analytics Tables:** rankings, analytics, activity

See `PROJECT_DOCUMENTATION.md` for detailed schema information.

## API Documentation

The platform uses tRPC for type-safe API calls. Key procedure groups include:

- `auth.*` - Authentication and session management
- `dashboard.*` - KPI metrics and activity feeds
- `jobs.*` - Job posting management
- `candidates.*` - Candidate profile management
- `rankings.*` - AI ranking and match analysis
- `system.*` - System notifications

All procedures are fully typed with TypeScript for end-to-end type safety.

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Authentication
JWT_SECRET=your-jwt-secret-key
VITE_APP_ID=your-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# LLM Integration
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=your-llm-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-llm-key

# Owner Information
OWNER_NAME=Your Name
OWNER_OPEN_ID=your-open-id
```

## Development

### Adding New Features

1. **Update Database Schema:** Modify `drizzle/schema.ts`
2. **Generate Migration:** Run `pnpm drizzle-kit generate`
3. **Apply Migration:** Use `webdev_execute_sql` to apply SQL
4. **Add Database Queries:** Update `server/db.ts`
5. **Create tRPC Procedures:** Add to `server/routers.ts`
6. **Build Frontend:** Create components in `client/src/pages/` or `client/src/components/`
7. **Write Tests:** Add vitest tests in `server/*.test.ts`

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/auth.logout.test.ts
```

### Code Quality

```bash
# Type checking
pnpm check

# Format code
pnpm format
```

## Deployment

The platform is designed for serverless deployment on Cloud Run with the following specifications:

- **Runtime:** Node.js
- **Resources:** 1 vCPU, 512 MiB RAM
- **Timeout:** 180 seconds
- **Scaling:** Autoscale (min-instances=0)

### Deployment Steps

1. Create a checkpoint: `webdev_save_checkpoint`
2. Click the Publish button in the Management UI
3. Configure custom domain if needed
4. Set up environment variables in the Settings panel

## Performance

The platform is optimized for performance with:

- React Query for efficient data fetching and caching
- Lazy-loaded components and code splitting
- Optimized database queries with proper indexing
- S3-based file storage for scalability
- Recharts for efficient chart rendering

## Security

- **Authentication:** Manus OAuth 2.0 with JWT sessions
- **Authorization:** Role-based access control (RBAC)
- **Data Protection:** Encrypted database connections and secure file storage
- **API Security:** tRPC type-safe procedures with authentication guards

## Troubleshooting

### Resume Parsing Issues
- Ensure files are in supported formats (PDF, DOCX)
- Check file size is under 10MB
- Verify file is not corrupted

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check MySQL/TiDB server is running
- Ensure SSL certificates are valid if required

### LLM Integration Issues
- Verify API keys are correct
- Check API endpoint URLs
- Review LLM service status

## Contributing

To contribute to TalentAI:

1. Create a feature branch
2. Make your changes
3. Write tests for new functionality
4. Submit a pull request

## Support

For issues, questions, or feature requests, please contact the TalentAI development team or visit the project documentation.

## License

MIT License - See LICENSE file for details

## Acknowledgments

- Built with React 19, Express 4, and tRPC 11
- Database powered by Drizzle ORM
- UI components from shadcn/ui
- Charts powered by Recharts
- Styling with Tailwind CSS 4
- AI integration with Claude/GPT LLMs

---

**TalentAI** - Intelligent Recruitment Made Simple
