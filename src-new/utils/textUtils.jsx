import React from 'react';

/**
 * Parses text containing asterisks (*) to apply highlighting.
 * Example: "Hello *World*" -> "Hello <span class='highlightClass'>World</span>"
 * 
 * @param {string} text - The text to parse
 * @param {string} highlightClass - The CSS class to apply to highlighted parts (default: 'highlight')
 * @returns {React.ReactNode} - The parsed React elements
 */
export const parseHighlightedText = (text, highlightClass = 'highlight') => {
  if (!text) return null;
  const parts = text.split('*');
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <span key={index} className={highlightClass}>{part}</span>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};
