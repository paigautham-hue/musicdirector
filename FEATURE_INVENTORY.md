# The Collective Soul - Feature Inventory

## Core Features

### Album Creation & Management
- **New Album** - Create AI-generated music albums with themes, vibes, influences
- **Album Workspace** - Edit tracks, lyrics, prompts, regenerate music
- **My Library** - View and manage user's created albums
- **Album Detail** - Public view of albums with social features

### Music Generation
- **Suno Integration** - Generate music tracks with AI
- **Track Management** - Edit, regenerate, download tracks
- **Audio Player** - Play music with controls

### Prompt System
- **My Prompts** - Save and manage personal album prompts
- **Community Prompts** - Browse 15 public prompt templates
- **Prompt Templates** - Pre-built prompts for different themes

### Playlist Features
- **My Playlists** - Create and manage personal playlists
- **Playlist Detail** - View, play, and manage playlist tracks
- **Discover Playlists** - Browse public community playlists with search/filter
- **Playlist Stats** - Dashboard showing playlist analytics
- **Add to Playlist** - Quick-add tracks from Album Workspace
- **Playlist Ratings** - Rate public playlists (1-5 stars)
- **AI Track Suggestions** - Get AI-powered track recommendations for playlists

### Social Features
- **Explore** - Discover public albums from community
- **Comments** - Comment on albums
- **Likes/Favorites** - Like albums
- **Ratings** - Rate albums (1-5 stars)
- **Follow Users** - Follow other creators
- **User Profiles** - View user profiles and their albums

### Payment & Credits
- **Pricing** - View credit packages and pricing
- **Payment** - Purchase credits with Stripe
- **Payment History** - View transaction history
- **Credit System** - Track credit balance and usage

### Admin Features
- **Admin Dashboard** - System overview and stats
- **Admin Settings** - System configuration
- **Admin Analytics** - Usage analytics and LLM health
- **User Quotas** - Manage user credit quotas

### Content Pages
- **Knowledge Hub** - Educational content about the platform
- **Impact Stories** - Success stories and testimonials
- **Gallery** - Showcase of featured albums

### User Account
- **Profile** - Edit user profile and settings
- **Authentication** - OAuth login/logout

---

## Navigation Audit

### Desktop Navigation (Current)
- Library
- Explore
- My Prompts
- Community
- Playlists (dropdown: My Playlists, Discover)
- Pricing
- Admin
- Create

### Mobile Navigation (Current)
- My Library
- Explore
- Community Prompts
- My Prompts
- My Playlists
- Discover Playlists
- Playlist Stats
- Knowledge Hub
- Impact Stories
- Pricing
- Admin
- Create Album
- Logout

### Missing from Navigation
**Desktop:**
- Playlist Stats (only in mobile)
- Payment History
- Profile/Settings
- Gallery

**Mobile:**
- Payment History
- Profile/Settings (except in footer)
- Gallery

### Features with No Direct Navigation Link
- Album Workspace (accessed via Library → album card)
- Album Detail (accessed via Explore → album card)
- Playlist Detail (accessed via My Playlists/Discover → playlist card)
- User Profile (accessed via album creator link)
- Payment Success (redirect page)
