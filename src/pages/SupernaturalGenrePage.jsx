import React from 'react';
import GenrePage from '../components/GenrePage';
export default function SupernaturalGenrePage({ favorites, onToggleFavorite }) {
  return <GenrePage genreId={37} favorites={favorites} onToggleFavorite={onToggleFavorite} />;
}
