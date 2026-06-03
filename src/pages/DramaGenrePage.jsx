import React from 'react';
import GenrePage from '../components/GenrePage';
export default function DramaGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={8} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}
