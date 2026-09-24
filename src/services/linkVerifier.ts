import { unwrapProofpointUrl } from './linkExtractor';

export type LinkAccessStatus =
  | 'accessible'    // Відкритий ресурс, доступ підтверджено (зелений)
  | 'restricted'    // Закритий ресурс, потрібен дозвіл / вхід (жовтий / pending access)
  | 'unc_network'   // Корпоративна мережа UNC (фіолетовий / pending access)
  | 'invalid'       // Недійсне посилання або 404 (червоний)
  | 'unknown';      // Зовнішній сайт, рекомендується відкрити вручну (сірий)

export interface LinkVerificationResult {
  url: string;
  cleanUrl: string;
  type: 'gdrive' | 'youtube' | 'vimeo' | 'unc' | 'web';
  status: LinkAccessStatus;
  message: string;
  title?: string;
  suggestedAction?: string;
}

/**
 * 2.4.7 Перевірка валідності та доступності ресурсів за посиланням
 */
export async function verifyResourceLink(rawUrl: string): Promise<LinkVerificationResult> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      url: '',
      cleanUrl: '',
      type: 'web',
      status: 'invalid',
      message: 'Посилання не вказано',
    };
  }

  // 1. Перевірка UNC-шляхів (локальна корпоративна мережа)
  if (trimmed.startsWith('\\\\')) {
    return {
      url: trimmed,
      cleanUrl: trimmed,
      type: 'unc',
      status: 'unc_network',
      message: 'Локальний мережевий шлях (UNC). Доступний лише з корпоративної мережі або через VPN.',
      suggestedAction: 'Матеріал зберігається зі статусом «Очікує доступу» до перевірки з корпоративного ПК.',
    };
  }

  const cleanUrl = unwrapProofpointUrl(trimmed);

  // 2. Валідація базового формату URL
  try {
    new URL(cleanUrl);
  } catch {
    return {
      url: trimmed,
      cleanUrl,
      type: 'web',
      status: 'invalid',
      message: 'Некоректний формат URL-адреси.',
      suggestedAction: 'Перевірте правильність введеного посилання (має починатися з https://).',
    };
  }

  const lower = cleanUrl.toLowerCase();

  // 3. YouTube посилання (використовуємо офіційний CORS-сумісний oEmbed API)
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = ytMatch ? ytMatch[1] : null;

    if (!videoId) {
      return {
        url: trimmed,
        cleanUrl,
        type: 'youtube',
        status: 'invalid',
        message: 'Не вдалося розпізнати Video ID в YouTube-посиланні.',
      };
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          url: trimmed,
          cleanUrl,
          type: 'youtube',
          status: 'accessible',
          title: data.title,
          message: `Відео YouTube доступне: "${data.title}"`,
          suggestedAction: 'Ресурс повністю відкритий для перегляду.',
        };
      } else if (res.status === 401 || res.status === 403) {
        return {
          url: trimmed,
          cleanUrl,
          type: 'youtube',
          status: 'restricted',
          message: 'Відео на YouTube має обмежений доступ (приватне або доступ за запитом).',
          suggestedAction: 'Зверніться до тренера для відкриття доступу за посиланням.',
        };
      } else {
        return {
          url: trimmed,
          cleanUrl,
          type: 'youtube',
          status: 'invalid',
          message: 'Відео не знайдено на YouTube (можливо видалене або посилання недійсне).',
        };
      }
    } catch {
      return {
        url: trimmed,
        cleanUrl,
        type: 'youtube',
        status: 'unknown',
        message: 'Розпізнано YouTube відео. Перевірте доступ вручну.',
        suggestedAction: 'Відкрийте посилання в сусідній вкладці для перевірки.',
      };
    }
  }

  // 4. Vimeo посилання
  if (lower.includes('vimeo.com')) {
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(cleanUrl)}`;
      const res = await fetch(oembedUrl);
      if (res.ok) {
        const data = await res.json();
        return {
          url: trimmed,
          cleanUrl,
          type: 'vimeo',
          status: 'accessible',
          title: data.title,
          message: `Відео Vimeo доступне: "${data.title}"`,
        };
      } else {
        return {
          url: trimmed,
          cleanUrl,
          type: 'vimeo',
          status: 'restricted',
          message: 'Відео Vimeo закрите або вимагає введення пароля.',
        };
      }
    } catch {
      return {
        url: trimmed,
        cleanUrl,
        type: 'vimeo',
        status: 'unknown',
        message: 'Розпізнано Vimeo посилання. Перевірте доступ вручну.',
      };
    }
  }

  // 5. Google Drive / Docs / Sheets
  if (lower.includes('drive.google.com') || lower.includes('docs.google.com')) {
    let fileId: string | null = null;
    const fileDMatch = cleanUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (fileDMatch) {
      fileId = fileDMatch[1];
    } else {
      const idParamMatch = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idParamMatch) fileId = idParamMatch[1];
    }

    const isFolder = lower.includes('/folders/') || lower.includes('folder');

    if (fileId && !isFolder && typeof window !== 'undefined' && typeof Image !== 'undefined') {
      const isPublic = await probeGoogleDriveThumbnail(fileId);
      if (isPublic) {
        return {
          url: trimmed,
          cleanUrl,
          type: 'gdrive',
          status: 'accessible',
          message: 'Google Drive файл відкрито: публічний доступ підтверджено.',
          suggestedAction: 'Файл доступний для перегляду та завантаження.',
        };
      } else {
        return {
          url: trimmed,
          cleanUrl,
          type: 'gdrive',
          status: 'restricted',
          message: 'Google Drive файл має обмежений доступ (вимагає входу або запиту дозволу).',
          suggestedAction: 'Матеріал зберігається зі статусом «Очікує доступу». Запитайте права у тренера.',
        };
      }
    }

    return {
      url: trimmed,
      cleanUrl,
      type: 'gdrive',
      status: 'restricted',
      message: isFolder
        ? 'Google Drive папка. Потребує перевірки прав доступу або логіну в Google.'
        : 'Google Drive документ. Потребує перевірки прав доступу.',
      suggestedAction: 'Матеріал отримує статус «Очікує доступу».',
    };
  }

  // 6. Інші веб-ресурси
  return {
    url: trimmed,
    cleanUrl,
    type: 'web',
    status: 'unknown',
    message: 'Зовнішнє веб-посилання. Відкрийте ресурс для перевірки доступу.',
    suggestedAction: 'Натисніть «Відкрити», щоб переконатися у відсутності помилки 404 або екрану входу.',
  };
}

/**
 * Проба публічного завантаження thumbnail Google Drive через Image об'єкт
 */
function probeGoogleDriveThumbnail(fileId: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      let timer: ReturnType<typeof setTimeout> | null = null;

      img.onload = () => {
        if (timer) clearTimeout(timer);
        resolve(true);
      };

      img.onerror = () => {
        if (timer) clearTimeout(timer);
        resolve(false);
      };

      timer = setTimeout(() => {
        img.src = '';
        resolve(false);
      }, 3000);

      img.src = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
    } catch {
      resolve(false);
    }
  });
}
