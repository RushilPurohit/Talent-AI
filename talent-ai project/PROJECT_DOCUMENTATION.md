# TalentAI - Explainable AI Hiring Intelligence

## Project Overview

TalentAI is a comprehensive enterprise SaaS platform designed to help recruiters and administrators intelligently source, parse, rank, and evaluate candidates against job postings using LLM-driven matching and explainable scoring.

## Architecture

### Technology Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Recharts
- **Backend:** Express 4, Node.js, tRPC 11
- **Database:** MySQL/TiDB with Drizzle ORM
- **Authentication:** Manus OAuth 2.0
- **AI/ML:** LLM integration (Claude/GPT) for semantic matching and analysis
- **File Storage:** S3-compatible storage for resume files

### Database Schema

#### Core Tables
- **users** - User authentication and role management (Admin, Recruiter)
- **jobs** - Job postings with descriptions and requirements
- **candidates** - Candidate information and contact details
- **resumes** - Resume files and parsed data storage

#### Candidate Profile Tables
- **skills** - Extracted skills with proficiency levels
- **experience** - Work history and employment details
- **education** - Educational background
- **projects** - Portfolio projects
- **certifications** - Professional certifications
- **languages** - Language proficiencies
- **achievements** - Notable achievements

#### AI & Analytics Tables
- **rankings** - AI ranking results with weighted scores
- **analytics** - KPI metrics and hiring statistics
- **activity** - Recent activity feed

## Features

### 1. Authentication and Access Control
- JWT-based login and signup
- Role-based access control (Admin and Recruiter roles)
- Protected routes enforced per role
- Session management with secure cookies

### 2. Enterprise Dashboard
- KPI cards: Total Candidates, Total Jobs, AI Matches, Interviews, Hiring Rate
- Recent activity feed
- Quick action buttons for job creation and resume upload
- Real-time data fetching

### 3. Job Management Module
- Create, edit, delete, and publish job postings
- Full job description storage
- Job status tracking (draft, published, closed)
- Recruiter-specific job management

### 4. Resume Upload and Parsing
- Support for PDF and DOCX file formats
- Bulk upload capability
- Drag-and-drop interface
- Upload progress indicators
- AI-powered resume parsing:
  - Skills extraction with proficiency levels
  - Work experience and employment history
  - Education and degrees
  - Professional certifications
  - Languages and achievements

### 5. AI Ranking Engine
- Semantic similarity scoring using LLM embeddings
- Weighted scoring model:
  - Skills: 40%
  - Experience: 25%
  - Projects: 15%
  - Education: 10%
  - Certifications: 5%
  - Activity: 5%
- Candidate-to-job matching

### 6. Explainable AI Recommendations
- Per-candidate breakdown of matched skills
- Strengths and weaknesses analysis
- Skill gaps identification
- AI-generated interview questions per candidate
- Detailed match explanations

### 7. Candidate Profiles
- Resume viewer with extracted data
- Skills, career timeline, education, projects, certificates
- AI-generated summary and AI score
- Profile view with detailed information

### 8. Advanced Search and Filtering
- Filter candidates by skills, experience, education, score, location, status
- Sortable and paginated candidate table
- Real-time search functionality
- Multi-filter support

### 9. Analytics Dashboard
- Pie, bar, and area charts covering:
  - Hiring funnel (Applied → Screened → Interviewed → Offered → Hired)
  - Top skills distribution
  - Candidate score distribution
  - Experience level distribution
  - Monthly hiring trends
- Key metrics:
  - Conversion rate
  - Average time to hire
  - Interview pass rate
- Excel and PDF export capabilities

## API Endpoints (tRPC Procedures)

### Authentication
- `auth.me` - Get current user information
- `auth.logout` - Logout current user

### Dashboard
- `dashboard.getMetrics` - Get KPI metrics
- `dashboard.getRecentActivity` - Get recent activity feed

### Jobs
- `jobs.create` - Create a new job posting
- `jobs.list` - List all jobs
- `jobs.getById` - Get job details
- `jobs.update` - Update job information
- `jobs.delete` - Delete a job posting

### Candidates
- `candidates.create` - Create a candidate profile
- `candidates.list` - List all candidates
- `candidates.getById` - Get candidate details
- `candidates.updateStatus` - Update candidate status

### Rankings
- `rankings.rankCandidates` - Generate AI rankings for candidates
- `rankings.getMatchDetails` - Get detailed match analysis
- `rankings.generateInterviewQuestions` - Generate interview questions

### System
- `system.notifyOwner` - Send notification to platform owner

## Scoring Model Details

### Weighted Scoring Calculation
```
Overall Score = (Skills × 0.40) + (Experience × 0.25) + (Projects × 0.15) + 
                (Education × 0.10) + (Certifications × 0.05) + (Activity × 0.05)
```

Each component is scored 0-100 based on:
- **Skills Match:** Semantic similarity between candidate skills and job requirements
- **Experience Match:** Years of experience and relevant positions
- **Projects Match:** Portfolio projects and deliverables alignment
- **Education Match:** Degrees and educational background relevance
- **Certifications Match:** Professional certifications alignment
- **Activity Score:** Recency of work and engagement level

## User Roles

### Admin
- Full access to all features
- User management capabilities
- System-wide analytics and reporting
- Configuration management

### Recruiter
- Job management (create, edit, delete)
- Resume upload and parsing
- Candidate management and evaluation
- Access to analytics for their own jobs
- Interview scheduling

## File Upload Specifications

### Supported Formats
- PDF (.pdf)
- DOCX (.docx)

### File Size Limits
- Maximum: 10MB per file
- Bulk upload: Multiple files supported

### Upload Process
1. Drag-and-drop or click to browse
2. File validation (format and size)
3. Upload to S3 storage
4. AI parsing of resume content
5. Candidate profile creation with extracted data

## AI Integration

### LLM Services Used
- Claude/GPT for semantic matching
- Structured JSON responses for consistency
- Fallback mechanisms for graceful degradation

### Interview Question Generation
- Personalized questions based on candidate profile
- Job-specific context integration
- Question categorization (technical, behavioral, experience, skills)
- Difficulty levels (easy, medium, hard)

### Match Analysis
- Comprehensive strength/weakness assessment
- Skill gap identification
- Hiring recommendations
- Detailed explanations for each scoring component

## Performance Considerations

### Database Optimization
- Indexed columns for fast queries
- Efficient relationship queries with Drizzle ORM
- Connection pooling for MySQL

### Frontend Optimization
- React Query for efficient data fetching
- Lazy loading of components
- Optimized chart rendering with Recharts
- CSS-in-JS with Tailwind for minimal bundle size

### API Optimization
- tRPC for type-safe API calls
- Superjson for proper date/complex type handling
- Pagination for large datasets

## Security

### Authentication
- Manus OAuth 2.0 integration
- JWT-based session management
- Secure cookie handling with HttpOnly flag

### Authorization
- Role-based access control (RBAC)
- Protected procedures with user context
- Admin-only operations guarded

### Data Protection
- Encrypted database connections
- Secure file storage in S3
- No sensitive data in logs

## Deployment

### Hosting
- Autoscale serverless deployment on Cloud Run
- Node.js runtime environment
- 1 vCPU, 512 MiB RAM
- 180s request timeout

### Environment Variables
- `DATABASE_URL` - MySQL connection string
- `JWT_SECRET` - Session signing secret
- `VITE_APP_ID` - OAuth application ID
- `OAUTH_SERVER_URL` - OAuth backend URL
- `BUILT_IN_FORGE_API_KEY` - LLM API key
- `VITE_FRONTEND_FORGE_API_KEY` - Frontend LLM access

## Development Workflow

### Local Development
```bash
cd /home/ubuntu/talent-ai
pnpm install
pnpm run dev
```

### Database Migrations
```bash
pnpm drizzle-kit generate
# Review generated SQL
# Apply via webdev_execute_sql
```

### Testing
```bash
pnpm test
```

### Building for Production
```bash
pnpm build
pnpm start
```

## Future Enhancements

1. **Advanced Filtering**
   - Custom filter combinations
   - Saved filter templates
   - Filter sharing between team members

2. **Bulk Operations**
   - Bulk candidate status updates
   - Batch interview scheduling
   - Bulk email communications

3. **Integration Capabilities**
   - ATS system integration
   - Calendar integration for interviews
   - Email integration for communications

4. **Advanced Analytics**
   - Predictive hiring analytics
   - Diversity metrics
   - Hiring performance benchmarking

5. **Collaboration Features**
   - Team comments on candidates
   - Shared evaluations
   - Interview feedback forms

## Support and Maintenance

### Common Issues
- Resume parsing failures: Check file format and size
- Slow analytics queries: Review database indexes
- OAuth issues: Verify redirect URLs and credentials

### Monitoring
- Dev server logs in `.manus-logs/devserver.log`
- Browser console logs in `.manus-logs/browserConsole.log`
- Network requests in `.manus-logs/networkRequests.log`

## Contact and Support
For questions or issues, please contact the TalentAI development team.
