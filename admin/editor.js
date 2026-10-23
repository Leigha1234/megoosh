import { supabase } from '../config.js';

const $ = (id) => document.getElementById(id);
const msg = (text) => {
  $('message').textContent = text;
};

const id = new URLSearchParams(location.search).get('id');

let current = null;
let busy = false;

// Initialise article editor
async function init() {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    $('blocked').textContent =
      'Please sign in from the admin dashboard first.';
    return;
  }

  const { data: admin } = await supabase
    .from('website_admins')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!admin) {
    $('blocked').textContent = 'Access denied.';
    return;
  }

  $('blocked').classList.add('hidden');
  $('editor').classList.remove('hidden');

  // Load blog categories
  const { data: categories, error: catErr } = await supabase
    .from('website_blog_categories')
    .select('id,name')
    .order('name');

  if (catErr) {
    msg(catErr.message);
  }

  for (const category of categories || []) {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = category.name;
    $('category').append(option);
  }

  // Load existing article when editing
  if (id) {
    const { data, error } = await supabase
      .from('website_blog_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      msg(error.message);
      return;
    }

    current = data;

    $('heading').textContent = 'Edit article.';

    const fields = [
      ['title', 'title'],
      ['slug', 'slug'],
      ['excerpt', 'excerpt'],
      ['content', 'content'],
      ['category', 'category_id'],
      ['author', 'author_name'],
      ['seo-title', 'seo_title'],
      ['seo-description', 'seo_description']
    ];

    for (const [input, column] of fields) {
      $(input).value = data[column] || '';
    }

    if (data.published_at) {
      const date = new Date(data.published_at);

      const local = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
      );

      $('publish-date').value = local.toISOString().slice(0, 16);
    }

    $('image-note').textContent = data.featured_image
      ? 'Featured image already uploaded. Select a new image to replace it.'
      : '';
  }
}

// Automatically generate a slug for new articles
$('title').addEventListener('input', () => {
  if (!id) {
    $('slug').value = $('title')
      .value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
});

// Save or publish an article
async function save(status) {
  if (busy) return;

  if (!$('form').reportValidity()) return;

  busy = true;
  msg('Saving…');

  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Session expired. Sign in again.');
    }

    let featured = current?.featured_image || null;

    // Upload featured image if one was selected
    const file = $('image').files[0];

    if (file) {
      const supportedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif'
      ];

      if (
        file.size > 5 * 1024 * 1024 ||
        !supportedTypes.includes(file.type)
      ) {
        throw new Error(
          'Please select a supported image under 5 MB.'
        );
      }

      const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
      };

      const ext = extensions[file.type];

      const path = `${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage
        .from('website-blog-images')
        .upload(path, file, {
          contentType: file.type,
          upsert: false
        });

      if (error) {
        throw error;
      }

      featured = supabase.storage
        .from('website-blog-images')
        .getPublicUrl(path).data.publicUrl;
    }

    // Handle publication date
    const date = $('publish-date').value;

    const publishedAt =
      status === 'published'
        ? date
          ? new Date(date).toISOString()
          : current?.status === 'published' && current.published_at
            ? current.published_at
            : new Date().toISOString()
        : null;

    // Prepare article data
    const payload = {
      title: $('title').value.trim(),
      slug: $('slug').value.trim(),
      excerpt: $('excerpt').value.trim(),
      content: $('content').value,
      category_id: $('category').value || null,
      author_name: $('author').value.trim() || 'Megoosh',
      seo_title: $('seo-title').value.trim() || null,
      seo_description:
        $('seo-description').value.trim() || null,
      featured_image: featured,
      status,
      published_at: publishedAt,
      scheduled_for: null
    };

    if (!current) {
      payload.author_id = user.id;
    }

    // Insert new article or update existing article
    const query = current
      ? supabase
          .from('website_blog_posts')
          .update(payload)
          .eq('id', current.id)
      : supabase
          .from('website_blog_posts')
          .insert(payload);

    const { data, error } = await query
      .select('id')
      .single();

    if (error) {
      throw error;
    }

    if (!data?.id) {
      throw new Error('Article could not be saved.');
    }

    // SUCCESS: Return to the articles dashboard
    // This applies to both Save Draft and Publish.
    window.location.href = './index.html';

    return;

  } catch (error) {
    console.error('Article save failed:', error);

    msg(error.message || String(error));

  } finally {
    busy = false;
  }
}

// Save draft
$('save-draft').addEventListener('click', () => {
  save('draft');
});

// Publish article
$('publish').addEventListener('click', () => {
  save('published');
});

// Delete article
$('delete').addEventListener('click', async () => {
  if (!current) {
    return msg('Nothing to delete yet.');
  }

  if (!confirm('Permanently delete this article?')) {
    return;
  }

  const { error } = await supabase
    .from('website_blog_posts')
    .delete()
    .eq('id', current.id);

  if (error) {
    return msg(error.message);
  }

  // Return to dashboard after deleting
  window.location.href = './index.html';
});

// Start editor
init();