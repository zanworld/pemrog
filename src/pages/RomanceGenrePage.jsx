import React from 'react';
import GenrePage from '../components/GenrePage';
export default function RomanceGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={22} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}
