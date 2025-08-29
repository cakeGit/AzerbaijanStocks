async function fetchTopAuthors() {
  try {
    console.log('Fetching authors from createranked API...');
    const response = await fetch('https://createranked.oreostack.uk/api/authors.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.authors) {
      throw new Error('Invalid response format from API');
    }

    const authors = data.authors;

    // Sort by downloadCount descending and take top 30
    const topAuthors = authors
      .sort((a, b) => b.downloadCount - a.downloadCount)
      .slice(0, 30);

    // Generate tickers and format the data
    const formattedAuthors = topAuthors.map((author, index) => {
      // Generate ticker from name (first 3 letters, uppercase)
      const ticker = author.name
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special characters
        .substring(0, 3)
        .toUpperCase()
        .padEnd(3, 'X'); // Pad with X if too short

      // Create curseforgeId (assuming it's the same as name but lowercase with underscores)
      const curseforgeId = author.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');

      return {
        ticker: ticker,
        name: author.name,
        authorUrl: `https://www.curseforge.com/members/${curseforgeId}/projects`,
        curseforgeId: curseforgeId
      };
    });

    // Output as formatted JSON
    console.log('Top 30 authors formatted for authors.json:');
    console.log(JSON.stringify(formattedAuthors, null, 2));

  } catch (error) {
    console.error('Error fetching authors:', error.message);
    process.exit(1);
  }
}

fetchTopAuthors();
