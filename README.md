# Connections Plus

A daily word puzzle game inspired by NYT Connections, featuring a unique 17-word variant with multi-level progression and "red herring" mechanics.

## 🎮 Game Overview

**Connections Plus** is an innovative twist on the classic Connections game that introduces:
- **17-word levels** (instead of 16) with strategic "red herring" words
- **Multi-level progression** through 4 increasingly challenging stages
- **Cumulative red herrings** that build mystery across levels
- **Epic Level 4 reveal** where all red herrings form their own "Double Meanings" group
- **Daily puzzle system** with scheduled releases and player tracking

### How It Works

Players progress through 4 levels, each containing word groups to discover:
- **Levels 1-3**: 16 regular words + accumulated red herrings + 1 new red herring (17-19 words total)
- **Level 4**: 16 words including the final "Double Meanings" group of all red herrings

The twist: Red herrings from previous levels might actually belong to groups in subsequent levels, creating layers of misdirection and discovery.

## 🎯 Game Rules & Mechanics

### Basic Rules
- Find groups of 4 related words
- 4 mistakes allowed per level
- Words shuffle automatically between attempts
- Complete all groups in a level to advance

### Difficulty Levels & Colors
- 🟨 **Yellow (Easiest)**: `#fbbf24` / `bg-amber-200`
- 🟩 **Green (Easy)**: `#a0c35a` / `bg-[#a0c35a]`
- 🔵 **Blue (Medium)**: `#b0c4ef` / `bg-[#b0c4ef]`
- 🟣 **Purple (Hard)**: `#ba81c5` / `bg-[#ba81c5]`
- 🔴 **Red (Ultimate)**: Red herrings/"Double Meanings" group

### Performance Ratings
Based on mistakes made per level:
- **Perfect**: 0 mistakes
- **Great**: 1 mistake  
- **Okay**: 2 mistakes
- **Not Bad**: 3 mistakes
- **Charity Case**: 4 mistakes

### Level Progression
1. **Level 1**: 17 words (16 groups + 1 red herring)
2. **Level 2**: 18 words (16 groups + 2 red herrings)  
3. **Level 3**: 19 words (16 groups + 3 red herrings)
4. **Level 4**: 16 words (12 regular groups + 4 red herrings as final group)

## 🛠 Technical Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **React**: Version 19.1.0
- **UI Library**: HeroUI 2.8.4 (Tailwind-based components)
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion 12.23.12
- **Date Handling**: date-fns 4.1.0
- **TypeScript**: Full TypeScript implementation

### Backend
- **Database**: Redis Cloud (hosted Redis instance)
- **Authentication**: Basic HTTP auth for admin panel
- **API**: Next.js API routes
- **AI Integration**: Claude API for word generation

### Infrastructure
- **Deployment**: Vercel-optimized
- **Build Tool**: Turbopack for faster development
- **Environment**: Node.js with Redis connectivity

## 🏗 Architecture Overview

### Data Storage
Redis key patterns:
```
game:{YYYY-MM-DD}           # Daily game configurations
player:{playerId}:{gameId}   # Player progress tracking
```

### Player Tracking
- **No login required**: Anonymous player identification
- **localStorage**: Persistent player ID across sessions
- **Cookies**: Backup identification method
- **Daily limits**: One game per day per player (UTC midnight reset)

### Game State Management
```typescript
interface GameConfig {
  id: string;
  date: string; 
  title: string;
  levels: Array<{
    groups: Array<{
      title: string;
      words: string[];
      color: string;
    }>;
    redHerring: string;
  }>;
}
```

### Admin Workflow
1. **Step 0**: Select date and puzzle title using HeroUI DatePicker
2. **Step 1**: Create red herring group (4 words for "Double Meanings")
3. **Steps 2-5**: Build levels 1-4 with Claude API word generation
4. **Assignment**: Distribute red herrings across levels 1-3
5. **Export**: Save to Redis with date-based scheduling

## 📱 User Interface

### Main Game (`/`)
- **Grid Layout**: Responsive 4x4 + overflow for 17-19 words
- **Level Indicator**: Shows current level (1-4) and progress
- **Puzzle Title**: Displays daily puzzle name
- **Navigation**: Links to calendar and admin panel

### Admin Panel (`/admin`)
- **Protected**: Basic authentication required
- **Date Selection**: HeroUI DatePicker for scheduling
- **AI Generation**: Claude API integration for word groups
- **Red Herring Management**: Assign herrings to specific levels
- **Live Preview**: See puzzle structure as you build

### Calendar View (`/calendar`)
- **Monthly Overview**: Visual calendar with puzzle indicators
- **Puzzle Management**: View, edit, delete existing puzzles
- **Statistics**: Monthly puzzle count and remaining days
- **Navigation**: Quick access to admin and game

## 🔌 API Routes

### Game APIs
- `GET /api/game` - Fetch today's puzzle
- `POST /api/game` - Save player progress
- `GET /api/player?playerId={id}` - Check player status

### Admin APIs  
- `POST /api/save-config` - Create/update puzzle for specific date
- `POST /api/generate-words` - Claude API word generation

### Calendar APIs
- `GET /api/games/list?year={y}&month={m}` - List month's puzzles
- `GET /api/games/{date}` - Get specific puzzle
- `PUT /api/games/{date}` - Update specific puzzle
- `DELETE /api/games/{date}` - Delete specific puzzle

## 🚀 Development Setup

### Prerequisites
```bash
Node.js 18+ 
Redis instance (Redis Cloud recommended)
Claude API key
```

### Environment Variables
Create `.env.local`:
```bash
# Claude API for word generation
CLAUDE_API_KEY=sk-ant-api03-...

# Redis configuration  
REDIS_HOST=redis-xxxxx.xxx.redns.redis-cloud.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password

# Admin authentication
ADMIN_USERNAME=your-admin-username  
ADMIN_PASSWORD=your-admin-password

# Site URL for production
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Installation & Running
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production  
npm run build
npm start
```

### Redis Setup
1. Create Redis Cloud instance
2. Configure environment variables
3. Test connection with admin panel

## 🎨 Game Creation Guide

### Red-Herring First Approach
The entire game design revolves around red herrings:

1. **Start with 4 red herring words** that will form the final "Double Meanings" group
2. **Assign one red herring** to each of levels 1-3  
3. **Create 16 regular groups** (4 per level for levels 1-3, 4 for level 4)
4. **Strategic placement**: Red herrings from early levels might fit groups in later levels

### Word Generation with Claude
- **Category Input**: Describe the word group (e.g., "Ocean Fish")
- **Title Input**: Display name for the group (e.g., "FISH")
- **Difficulty Selection**: Choose appropriate color/difficulty
- **AI Enhancement**: Claude generates 4 related words

### Example Game Structure
```
Level 1: APOSTLES (4) + SYMBOLS (4) + CRAYONS (4) + DOGS (4) + PARKER (red herring)
Level 2: MOUNTAINS (4) + RIVERS (4) + CRABS (4) + ISLANDS (4) + PARKER + MONTBLANC (red herrings)  
Level 3: HOSPITALITY (4) + NURSING (4) + SPORTS (4) + PRESIDENTS (4) + PARKER + MONTBLANC + CROSS (red herrings)
Level 4: BEACHES (4) + CURRIES (4) + FRENCH FOOD (4) + DOUBLE MEANINGS (PARKER, MONTBLANC, CROSS, PEN BRAND) (4)
```

## 🔐 Authentication & Security

### Admin Protection
- **Middleware**: `/middleware.ts` protects `/admin/*` routes
- **Basic Auth**: Username/password from environment variables  
- **Session**: No persistent sessions, authenticate per request

### Player Privacy
- **Anonymous**: No personal data collection
- **Local Storage**: Player ID stored locally
- **No Tracking**: No cross-site tracking or analytics

## 🚀 Deployment

### Vercel Deployment
1. Connect GitHub repository
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds on commit

### Required Environment Variables in Production
- All `.env.local` variables must be configured
- Redis connection must be accessible from deployment
- Claude API key must be valid

## 🔮 Future Enhancements

### Potential Features
- **Statistics Dashboard**: Player performance analytics
- **Sharing System**: Share results like Wordle
- **Difficulty Variants**: Easy/Hard modes
- **Themes**: Seasonal or topical puzzle themes
- **Hints System**: Optional clues for struggling players
- **Mobile App**: Native iOS/Android versions

### Technical Improvements  
- **Caching**: Redis caching for improved performance
- **Analytics**: Player behavior insights
- **A/B Testing**: Puzzle difficulty optimization
- **Offline Support**: PWA with offline puzzle capability

## 🐛 Known Limitations

- **One Puzzle Per Day**: Players must wait for next day
- **No Undo**: No way to undo completed groups
- **Browser Dependent**: Player ID tied to specific browser
- **Admin Only**: No multi-admin support

## 📄 License

Private project - All rights reserved.

---

**Built with ❤️ using Next.js, HeroUI, and Redis**