import yamlFormatter from './yaml';
import tomlFormatter from './toml';
import jsonFormatter from './json';
import FrontmatterFormatter from './frontmatter';

export const supportedFormats = [
  'markdown',
  'yaml',
  'toml',
  'json',
  'html',
];

export const formatToExtension = format => ({
  markdown: 'md',
  yaml: 'yml',
  toml: 'toml',
  json: 'json',
  html: 'html',
}[format]);

export function formatByExtension(extension) {
  return {
    yml: yamlFormatter,
    yaml: yamlFormatter,
    toml: tomlFormatter,
    json: jsonFormatter,
    md: FrontmatterFormatter,
    markdown: FrontmatterFormatter,
    html: FrontmatterFormatter,
  }[extension];
}

export function formatByName(name) {
  return {
    yml: yamlFormatter,
    yaml: yamlFormatter,
    toml: tomlFormatter,
    json: jsonFormatter,
    markdown: FrontmatterFormatter,
    html: FrontmatterFormatter,
    frontmatter: FrontmatterFormatter,
  }[name];
}

export function resolveFormat(collectionOrEntity, entry) {
  // If the format is specified in the collection, use that format.
  const format = collectionOrEntity.get('format');
  if (format) {
    return formatByName(format);
  }

  // If a file already exists, infer the format from its file extension.
  const filePath = entry && entry.path;
  if (filePath) {
    const fileExtension = filePath.split('.').pop();
    return formatByExtension(fileExtension);
  }
}
