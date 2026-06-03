import React from 'react';
import GenrePage from '../components/GenrePage';
export default function FantasyGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={10} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}
