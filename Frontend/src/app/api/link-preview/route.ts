import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // Validate URL
        const parsedUrl = new URL(url);

        // Fetch the page
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ChillSpaceBot/1.0)'
            }
        });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();

        // Parse Open Graph meta tags
        const getMetaContent = (property: string): string | null => {
            const regex = new RegExp(
                `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']|<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
                'i'
            );
            const match = html.match(regex);
            return match ? (match[1] || match[2]) : null;
        };

        const getTitle = (): string => {
            // Try OG title first
            const ogTitle = getMetaContent('og:title');
            if (ogTitle) return ogTitle;

            // Fallback to <title> tag
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            return titleMatch ? titleMatch[1].trim() : parsedUrl.hostname;
        };

        const getFavicon = (): string | null => {
            // Try to find favicon link
            const faviconMatch = html.match(
                /<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']*)["']/i
            );

            if (faviconMatch && faviconMatch[1]) {
                const faviconUrl = faviconMatch[1];
                // Handle relative URLs
                if (faviconUrl.startsWith('//')) {
                    return `https:${faviconUrl}`;
                } else if (faviconUrl.startsWith('/')) {
                    return `${parsedUrl.origin}${faviconUrl}`;
                } else if (!faviconUrl.startsWith('http')) {
                    return `${parsedUrl.origin}/${faviconUrl}`;
                }
                return faviconUrl;
            }

            // Default favicon path
            return `${parsedUrl.origin}/favicon.ico`;
        };

        const preview = {
            url,
            title: getTitle(),
            description: getMetaContent('og:description') || getMetaContent('description') || '',
            image: getMetaContent('og:image'),
            favicon: getFavicon(),
            siteName: getMetaContent('og:site_name') || parsedUrl.hostname
        };

        // Handle relative image URLs
        if (preview.image && !preview.image.startsWith('http')) {
            if (preview.image.startsWith('//')) {
                preview.image = `https:${preview.image}`;
            } else if (preview.image.startsWith('/')) {
                preview.image = `${parsedUrl.origin}${preview.image}`;
            }
        }

        return NextResponse.json(preview);
    } catch (error) {
        console.error('Link preview error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch link preview' },
            { status: 500 }
        );
    }
}
