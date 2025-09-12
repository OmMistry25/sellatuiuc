-- Seed categories
insert into public.categories (name, slug, description) values
  ('Tickets', 'tickets', 'Event tickets, concert tickets, sports tickets'),
  ('Textbooks', 'textbooks', 'Course textbooks and academic materials'),
  ('iClickers', 'iclickers', 'iClicker remote response devices'),
  ('Lab Equipment', 'lab_equipment', 'Laboratory equipment and supplies'),
  ('Other', 'other', 'Miscellaneous items and equipment')
on conflict (slug) do nothing;
