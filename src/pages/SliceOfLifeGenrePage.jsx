import React from 'react';
import GenrePage from '../components/GenrePage';
export default function SliceOfLifeGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={36} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}
