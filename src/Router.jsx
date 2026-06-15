import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import FavoritesPage from './pages/FavoritesPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpFAQPage from './pages/HelpFAQPage';
import TopRatedPage from './pages/TopRatedPage';
import PopularPage from './pages/PopularPage';
import UpcomingPage from './pages/UpcomingPage';
import NewReleasesPage from './pages/NewReleasesPage';
import RecommendationsPage from './pages/RecommendationsPage';
import EditorPicksPage from './pages/EditorPicksPage';
import TrendingPage from './pages/TrendingPage';
import ReadingHistoryPage from './pages/ReadingHistoryPage';
import ReadLaterPage from './pages/ReadLaterPage';
import BookmarksPage from './pages/BookmarksPage';
import ActionGenrePage from './pages/ActionGenrePage';
import AdventureGenrePage from './pages/AdventureGenrePage';
import ComedyGenrePage from './pages/ComedyGenrePage';
import DramaGenrePage from './pages/DramaGenrePage';
import FantasyGenrePage from './pages/FantasyGenrePage';
import RomanceGenrePage from './pages/RomanceGenrePage';
import SciFiGenrePage from './pages/SciFiGenrePage';
import SliceOfLifeGenrePage from './pages/SliceOfLifeGenrePage';
import SupernaturalGenrePage from './pages/SupernaturalGenrePage';
import MysteryGenrePage from './pages/MysteryGenrePage';
import PublisherPage from './components/PublisherPage';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/BookingPage';

export default function AppRouter({ catalogElement, favoritesElement, aboutElement, favorites, onToggleFavorite }) {
  return (
    <Routes>
      <Route path="/" element={catalogElement} />
      <Route path="/catalog" element={catalogElement} />
      <Route path="/favorites" element={favoritesElement} />
      <Route path="/about" element={aboutElement} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/helpfaq" element={<HelpFAQPage />} />
      <Route path="/toprated" element={<TopRatedPage />} />
      <Route path="/popular" element={<PopularPage />} />
      <Route path="/upcoming" element={<UpcomingPage />} />
      <Route path="/newreleases" element={<NewReleasesPage />} />
      <Route path="/recommendations" element={<RecommendationsPage />} />
      <Route path="/editorpicks" element={<EditorPicksPage />} />
      <Route path="/trending" element={<TrendingPage />} />
      <Route path="/readinghistory" element={<ReadingHistoryPage />} />
      <Route path="/readlater" element={<ReadLaterPage />} />
      <Route path="/bookmarks" element={<BookmarksPage />} />
      <Route path="/actiongenre" element={<ActionGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/adventuregenre" element={<AdventureGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/comedygenre" element={<ComedyGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/dramagenre" element={<DramaGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/fantasygenre" element={<FantasyGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/romancegenre" element={<RomanceGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/scifigenre" element={<SciFiGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/sliceoflifegenre" element={<SliceOfLifeGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/supernaturalgenre" element={<SupernaturalGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/mysterygenre" element={<MysteryGenrePage favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/shueisha" element={<PublisherPage publisherId="shueisha" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/kodansha" element={<PublisherPage publisherId="kodansha" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/shogakukan" element={<PublisherPage publisherId="shogakukan" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/kadokawa" element={<PublisherPage publisherId="kadokawa" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/squareenix" element={<PublisherPage publisherId="squareenix" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/vizmedia" element={<PublisherPage publisherId="vizmedia" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/yenpress" element={<PublisherPage publisherId="yenpress" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/sevenseas" element={<PublisherPage publisherId="sevenseas" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/darkhorse" element={<PublisherPage publisherId="darkhorse" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
      <Route path="/vertical" element={<PublisherPage publisherId="vertical" favorites={favorites} onToggleFavorite={onToggleFavorite} />} />
    </Routes>
  );
}
