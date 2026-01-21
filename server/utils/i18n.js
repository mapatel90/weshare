import en from '../../src/translations/en.json' with { type: 'json' };
import vi from '../../src/translations/vi.json' with { type: 'json' };

const translations = { en, vi };

export const t = (lang, key, vars = {}) => {
  let text = key.split('.').reduce(
    (o, i) => o?.[i],
    translations[lang] || translations.en
  );

  if (typeof text !== 'string') return key;

  return text.replace(/{{(.*?)}}/g, (_, v) => vars[v.trim()] ?? '');
};


export const getUserLanguage = async (userId) => {
  if (!userId) return DEFAULT_LANGUAGE;

  try {
    const user = await prisma.users.findUnique({
      where: {
        id: parseInt(userId),
      },
      select: {
        language: true,
      },
    });

    return user?.language || "en";
  } catch (error) {
    console.error('getUserLanguage error:', error);
    return DEFAULT_LANGUAGE;
  }
};