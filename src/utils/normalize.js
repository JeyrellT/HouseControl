export function normalizeCollection(items = []) {
  const allIds = [];
  const byId = {};

  items.forEach((item) => {
    if (!item || !item.id) {
      return;
    }

    allIds.push(item.id);
    byId[item.id] = item;
  });

  return {
    byId,
    allIds
  };
}
