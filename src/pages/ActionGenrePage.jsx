import React from 'react';
import GenrePage from '../components/GenrePage';
export default function ActionGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={1} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}
