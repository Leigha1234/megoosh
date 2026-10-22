MEGOOSH BLOG - SETUP

1. Copy config.js, styles.css, blog.html, blog-post.html, blog.js, post.js and the whole admin folder into the ROOT of your existing GitHub Pages repository. Do not replace the existing index.html or application.html.
2. Commit and push. Allow GitHub Pages to deploy.
3. Visit YOUR-SITE/admin/ and sign in with the EXISTING Supabase Auth email/password for Iona or The Organised Types. Their website_admins records already exist.
4. Create a test draft, then publish it. Visit YOUR-SITE/blog.html.
5. Add a link to blog.html in the existing homepage navigation (a simple <a href="blog.html">Blog</a> is sufficient).

IMPORTANT: Existing Supabase accounts must have a valid password for password login. If the account uses OAuth or magic links only, configure the appropriate login method before using the dashboard.

SECURITY: Uses only the public publishable key; never place a service_role/secret key in these files. Supabase RLS enforces write permissions. Public storage bucket means any uploaded image URL is publicly accessible, including images uploaded for drafts; do not upload private images. HTML is displayed as plain text to avoid script injection.

SCHEDULING: Published posts with a future published_at remain hidden until that timestamp. The editor stores status=published, not scheduled.

SEO LIMITATION: GitHub Pages serves the same blog-post.html shell for every article, so dynamic title/meta updates happen in browsers, not in initial HTML. For reliable social previews and indexing, consider static prerendering/build automation or server-rendered blog pages.

TEST: Verify login, draft privacy, public reads, upload, publish, edit, deletion, and unauthorized-account denial before linking publicly.
