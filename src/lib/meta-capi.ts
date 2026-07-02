export function stripBrand(name: string): string {
  return name.replace(/caterpillar\s*/gi, "").replace(/\s+/g, " ").trim();
}

// Meta Pixel/CAPI removed — function kept as no-op to avoid breaking imports
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendMetaEvent(_event: any): Promise<void> {
  return;
}
