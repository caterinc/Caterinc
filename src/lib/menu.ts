export interface MenuItemLike {
  id: string;
  label: string;
  url: string;
}

export interface MenuGroup {
  header: MenuItemLike | null;
  items: MenuItemLike[];
}

// Items with an empty url act as group headers; everything after one (until
// the next header) belongs to that group. Items before any header are
// returned as a single header-less group.
export function groupMenuItems(items: MenuItemLike[]): MenuGroup[] {
  const groups: MenuGroup[] = [];
  let current: MenuGroup = { header: null, items: [] };

  for (const item of items) {
    if (!item.url) {
      if (current.header || current.items.length) groups.push(current);
      current = { header: item, items: [] };
    } else {
      current.items.push(item);
    }
  }
  if (current.header || current.items.length) groups.push(current);

  return groups;
}
