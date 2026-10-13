import linksData from './links.json';
import { LinksDataSchema, type LinksData } from './schema';

export const links: LinksData = LinksDataSchema.parse(linksData);
