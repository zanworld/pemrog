const fs = require('fs');
const path = require('path');

const pages = [
  'HomePage', 'CatalogPage', 'FavoritesPage', 'AboutPage', 'ProfilePage', 'SettingsPage', 'HelpFAQPage',
  'TopRatedPage', 'PopularPage', 'UpcomingPage', 'NewReleasesPage', 'RecommendationsPage', 'EditorPicksPage', 'TrendingPage', 'ReadingHistoryPage', 'ReadLaterPage', 'BookmarksPage',
  'ActionGenrePage', 'AdventureGenrePage', 'ComedyGenrePage', 'DramaGenrePage', 'FantasyGenrePage', 'RomanceGenrePage', 'SciFiGenrePage', 'SliceOfLifeGenrePage', 'SupernaturalGenrePage', 'MysteryGenrePage',
  'ShueishaPage', 'KodanshaPage', 'ShogakukanPage', 'KadokawaPage', 'SquareEnixPage', 'VizMediaPage', 'YenPressPage', 'SevenSeasPage', 'DarkHorsePage', 'VerticalPage'
];

let imports = `import React from 'react';\nimport { Routes, Route } from 'react-router-dom';\n`;
pages.forEach(p => {
  imports += `import ${p} from './pages/${p}';\n`;
});

let routes = `export default function AppRouter({ catalogElement, favoritesElement, aboutElement }) {\n  return (\n    <Routes>\n      <Route path="/" element={catalogElement} />\n      <Route path="/catalog" element={catalogElement} />\n      <Route path="/favorites" element={favoritesElement} />\n      <Route path="/about" element={aboutElement} />\n`;

pages.forEach(p => {
  if (p !== 'CatalogPage' && p !== 'FavoritesPage' && p !== 'AboutPage') {
    const routePath = '/' + p.replace('Page', '').toLowerCase();
    routes += `      <Route path="${routePath}" element={<${p} />} />\n`;
  }
});

routes += `    </Routes>\n  );\n}\n`;

fs.writeFileSync(path.join(__dirname, 'src', 'Router.jsx'), imports + '\n' + routes);
console.log('src/Router.jsx successfully generated!');
