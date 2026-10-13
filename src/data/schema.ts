import { z } from 'zod';

export const LinkSchema = z.object({
  name: z.string().min(1),
  url: z.string().url().startsWith('https://'),
  description: z.string().max(200).optional(),
  tags: z.array(z.string()).optional(),
});

export const CategorySchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  icon: z.string().min(1),
  links: z.array(LinkSchema),
});

export const LinksDataSchema = z.object({
  categories: z.array(CategorySchema).min(1),
});

export type Link = z.infer<typeof LinkSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type LinksData = z.infer<typeof LinksDataSchema>;
