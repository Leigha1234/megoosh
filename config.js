import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase = createClient('https://ffhbczsskmedxapcdtho.supabase.co', 'sb_publishable_1w9-Y5PrjdgKouNXL7b1MQ_2cREU-US');
export const blogLink = (slug) => `blog-post.html?slug=${encodeURIComponent(slug)}`;
export const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}) : '';
