-- Soul Space demo seed (run in Supabase SQL editor after Auth users exist)
-- 1. Create users in Authentication with emails below (or change emails here).
-- 2. Set roles:
--    update public.users set role = 'ngo' where email = 'ngo@demo.soulspace.dev';
--    update public.users set role = 'brand' where email = 'brand@demo.soulspace.dev';
--    update public.users set role = 'admin' where email = 'admin@demo.soulspace.dev';
-- 3. Run this file.

-- Demo NGOs (linked by email)
insert into public.ngos (user_id, organization_name, registration_number, verification_status, description, address, pan_number)
select u.id, 'Green Vista Foundation', 'GVF-2012-114', 'verified',
  'Coastal reforestation and school WASH programs across Andhra Pradesh.',
  'Visakhapatnam, Andhra Pradesh', 'AABCG1234F'
from auth.users u where u.email = 'ngo@demo.soulspace.dev'
on conflict (user_id) do nothing;

insert into public.ngos (user_id, organization_name, registration_number, verification_status, description, address, pan_number)
select u.id, 'Hope Meals Collective', 'HMC-2018-009', 'verified',
  'Nutrition security for children in urban shelter homes.',
  'Hyderabad, Telangana', 'AABCH5678G'
from auth.users u where u.email = 'ngo2@demo.soulspace.dev'
on conflict (user_id) do nothing;

-- Brand profile
insert into public.brands (user_id, company_name, logo_url)
select u.id, 'BlueTide Consumer Co.',
  'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&q=80'
from auth.users u where u.email = 'brand@demo.soulspace.dev'
on conflict (user_id) do nothing;

-- Projects
insert into public.projects (
  ngo_id, title, description, location, latitude, longitude,
  goal_amount, funds_raised, micro_donation_units, timeline_start, timeline_end,
  status, cover_image_url, impact_metrics, volunteer_slots, volunteer_count,
  donor_count, beneficiaries_impacted, volunteer_category
)
select
  n.id,
  'Plant 10,000 trees in Vizag',
  'Community-led mangrove and hillside planting with local schools. Each ₹200 covers sapling, soil, and 1 year care.',
  'Visakhapatnam, Andhra Pradesh', 17.6868, 83.2185,
  2000000, 640000,
  '[{"amount":50,"label":"Soil nutrition for 2 saplings"},{"amount":200,"label":"1 tree planted & maintained"},{"amount":1000,"label":"Mini grove of 5 trees"}]'::jsonb,
  '2026-01-01', '2026-12-31',
  'active',
  'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80',
  '{"trees_target":10000,"schools":12,"volunteer_hours":2400}'::jsonb,
  80, 34, 412, 1800, 'Environment'
from public.ngos n
join auth.users u on u.id = n.user_id
where u.email = 'ngo@demo.soulspace.dev'
and not exists (
  select 1 from public.projects p where p.ngo_id = n.id and p.title = 'Plant 10,000 trees in Vizag'
);

insert into public.projects (
  ngo_id, title, description, location, latitude, longitude,
  goal_amount, funds_raised, micro_donation_units, timeline_start, timeline_end,
  status, cover_image_url, impact_metrics, volunteer_slots, volunteer_count,
  donor_count, beneficiaries_impacted, volunteer_category
)
select
  n.id,
  'Feed 500 children — daily meals',
  'Hot lunches and weekend grocery kits for orphanage partners in Hyderabad.',
  'Hyderabad, Telangana', 17.3850, 78.4867,
  800000, 310000,
  '[{"amount":50,"label":"1 child · 1 day meals"},{"amount":200,"label":"Weekend kit for 4 children"},{"amount":1000,"label":"School month nutrition pack"}]'::jsonb,
  '2026-02-01', '2026-11-30',
  'active',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773f?w=1200&q=80',
  '{"children_reached":500,"meals_served_weekly":2100}'::jsonb,
  40, 18, 890, 500, 'Food security'
from public.ngos n
join auth.users u on u.id = n.user_id
where u.email = 'ngo2@demo.soulspace.dev'
and not exists (
  select 1 from public.projects p where p.ngo_id = n.id and p.title = 'Feed 500 children — daily meals'
);

-- Approved impact posts (uses first matching project per NGO)
insert into public.impact_updates (project_id, media_url, media_type, caption, moderation_status, like_count, share_count)
select p.id,
  'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80',
  'image',
  'Volunteers planted 400 saplings along the Vizag ridge today — thank you donors for the micro-units that made this possible.',
  'approved', 128, 22
from public.projects p
join public.ngos n on n.id = p.ngo_id
join auth.users u on u.id = n.user_id
where u.email = 'ngo@demo.soulspace.dev' and p.title = 'Plant 10,000 trees in Vizag'
and not exists (select 1 from public.impact_updates iu where iu.project_id = p.id);

insert into public.impact_updates (project_id, media_url, media_type, caption, moderation_status, like_count, share_count)
select p.id,
  'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=1200&q=80',
  'image',
  'Children receiving today’s hot lunch program — full plates, full hearts.',
  'approved', 256, 41
from public.projects p
join public.ngos n on n.id = p.ngo_id
join auth.users u on u.id = n.user_id
where u.email = 'ngo2@demo.soulspace.dev' and p.title = 'Feed 500 children — daily meals'
and not exists (select 1 from public.impact_updates iu where iu.project_id = p.id);

-- Sponsorship (optional — requires brand + first project)
insert into public.sponsorships (brand_id, project_id, amount, campaign_title)
select b.id, p.id, 250000, 'Clean Coastline powered by BlueTide'
from public.brands b
join auth.users u on u.id = b.user_id
cross join lateral (
  select pr.id from public.projects pr
  join public.ngos n on n.id = pr.ngo_id
  join auth.users u2 on u2.id = n.user_id
  where u2.email = 'ngo@demo.soulspace.dev' and pr.title = 'Plant 10,000 trees in Vizag'
  limit 1
) p
where u.email = 'brand@demo.soulspace.dev'
on conflict (brand_id, project_id) do nothing;
