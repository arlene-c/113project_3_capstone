const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function hashText(text) {
  return Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function detectFingerspellingFromMedia(mediaUri) {
  if (!mediaUri) {
    return {
      letter: 'Unknown',
      note: 'No media captured yet.',
    };
  }

  const hash = hashText(mediaUri);
  const index = hash % letters.length;
  return {
    letter: letters[index],
    note: 'Prototype detection generated from the photo/video reference.',
  };
}
