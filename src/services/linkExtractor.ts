import { ParsedLink } from '../types';

/**
 * 2.4.2 Розгортання обгорток Proofpoint (urldefense.com)
 */
export function unwrapProofpointUrl(url: string): string {
  if (!url.includes('urldefense')) return url;

  try {
    // Proofpoint v2: urldefense.proofpoint.com/v2/url?u=http-3A__...
    if (url.includes('/v2/url?u=')) {
      const uMatch = url.match(/[?&]u=([^&]+)/);
      if (uMatch && uMatch[1]) {
        let decoded = decodeURIComponent(uMatch[1]);
        decoded = decoded.replace(/-/g, '%').replace(/_/g, '/');
        try {
          return decodeURIComponent(decoded);
        } catch {
          return decoded;
        }
      }
    }

    // Proofpoint v3: urldefense.com/v3/__https://target.com/__;!!...
    if (url.includes('/v3/__')) {
      const v3Match = url.match(/\/v3\/__([^_]+)__/);
      if (v3Match && v3Match[1]) {
        return v3Match[1];
      }
    }
  } catch (e) {
    console.warn('Помилка декодування Proofpoint URL:', url, e);
  }

  return url;
}

/**
 * 2.4.3 & 2.4.4 Витяг та класифікація посилань
 */
export function extractAndClassifyLinks(textOrHtml: string): ParsedLink[] {
  const links: ParsedLink[] = [];
  const seenUrls = new Set<string>();

  // 1. Пошук стандартних URL (http, https)
  const urlRegex = /(https?:\/\/[^\s"'<>\)]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(textOrHtml)) !== null) {
    let rawUrl = match[1];
    // Очищаємо від кінцевих розділових знаків
    rawUrl = rawUrl.replace(/[.,;\)]+$/, '');

    if (seenUrls.has(rawUrl)) continue;
    seenUrls.add(rawUrl);

    const cleanUrl = unwrapProofpointUrl(rawUrl);
    const classified = classifySingleUrl(rawUrl, cleanUrl);
    links.push(classified);
  }

  // 2. Пошук UNC-шляхів: \\fs1\projects\...
  const uncRegex = /(\\\\[a-zA-Z0-9_\.\-]+\\[^\s"'<>\)]+)/gi;
  while ((match = uncRegex.exec(textOrHtml)) !== null) {
    const rawUnc = match[1].replace(/[.,;\)]+$/, '');
    if (seenUrls.has(rawUnc)) continue;
    seenUrls.add(rawUnc);

    links.push({
      id: `unc_${links.length + 1}`,
      rawUrl: rawUnc,
      cleanUrl: rawUnc,
      type: 'unc',
      uncPath: rawUnc,
      isNoise: false,
    });
  }

  return links;
}

function classifySingleUrl(rawUrl: string, cleanUrl: string): ParsedLink {
  const lower = cleanUrl.toLowerCase();
  const id = `link_${Math.random().toString(36).substring(2, 9)}`;

  // 2.4.4 Відсіювання службових посилань
  if (
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.includes('aka.ms/getoutlook') ||
    lower.includes('microsoft.com/privacy') ||
    lower.includes('t.me/') ||
    lower.includes('facebook.com') ||
    lower.includes('instagram.com') ||
    lower.includes('linkedin.com') ||
    lower.includes('unsubscribe') ||
    lower.includes('/unsubscribe')
  ) {
    return {
      id,
      rawUrl,
      cleanUrl,
      type: 'noise',
      isNoise: true,
      noiseReason: 'Службове посилання (соцмережі / пошта / підписка)',
    };
  }

  // Google Drive посилання: drive.google.com/file/d/<id>/view або docs.google.com/...
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    let gdriveId: string | undefined;

    const fileDMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch) {
      gdriveId = fileDMatch[1];
    } else {
      const idParamMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idParamMatch) {
        gdriveId = idParamMatch[1];
      }
    }

    return {
      id,
      rawUrl,
      cleanUrl,
      type: 'gdrive',
      gdriveId,
      isNoise: false,
    };
  }

  return {
    id,
    rawUrl,
    cleanUrl,
    type: 'external',
    isNoise: false,
  };
}
