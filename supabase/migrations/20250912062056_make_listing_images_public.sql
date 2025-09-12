-- Make listing-images bucket public for easier access
update storage.buckets 
set public = true 
where id = 'listing-images';
