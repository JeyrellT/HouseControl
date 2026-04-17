export function updateNormalizedItem(slice, itemId, updater) {
  const currentItem = slice.byId[itemId];

  if (!currentItem) {
    return slice;
  }

  const nextItem = updater(currentItem);

  if (nextItem === currentItem) {
    return slice;
  }

  return {
    ...slice,
    byId: {
      ...slice.byId,
      [itemId]: nextItem
    }
  };
}

