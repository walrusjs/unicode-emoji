export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\(.+\)/g, '')
    .trim()
    .replace(/[\W|_]+/g, '_')
    .toLowerCase();
}
