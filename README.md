# E-Commerce Store Aggregator

An advanced e-commerce store aggregator that dynamically scrapes and displays product information from multiple online store URLs with enhanced data extraction and presentation capabilities.

## Features

- Advanced web scraping with robust error handling
- Cross-platform product data extraction
- Responsive web interface for intuitive product browsing
- TypeScript-based implementation with modular architecture
- API-driven product retrieval and management
- Displays prices in the same format as original stores
- Uses Scrape.do API for enhanced scraping capabilities

## Tech Stack

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Data Processing**: Cheerio for HTML parsing
- **State Management**: TanStack Query (React Query)
- **Styling**: TailwindCSS with Shadcn components

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ecommerce-store-aggregator.git
   cd ecommerce-store-aggregator
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with:
   ```
   SCRAPE_DO_API_KEY=your_scrape_do_api_key_here
   ```

4. Run the application
   ```bash
   npm run dev
   ```

## Usage

1. Navigate to the home page
2. Select from available e-commerce stores or enter a custom URL
3. View aggregated product results with consistent formatting
4. Browse products from different sources in a unified interface

## Configuration

- **Theme**: Modify `theme.json` to customize the application appearance
- **Store Presets**: Update the store list in `client/src/components/store-selector.tsx`

## API Integration

This application uses the [Scrape.do](https://scrape.do/) API for enhanced web scraping capabilities. You'll need to:

1. Sign up for an account at [Scrape.do](https://scrape.do/)
2. Get your API key from your account dashboard
3. Add the API key to your environment variables

## License

MIT

## Acknowledgements

- [Shadcn UI](https://ui.shadcn.com/) for UI components
- [TailwindCSS](https://tailwindcss.com/) for styling
- [Cheerio](https://cheerio.js.org/) for HTML parsing