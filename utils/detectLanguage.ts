// util/detectLanguage.ts
export const detectLanguage = (text: string): 'korean' | 'english' | 'french' => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    const frenchRegex = /[éèêëàâçîïôûùœ]/i;

    if (koreanRegex.test(text)) return 'korean';
    if (frenchRegex.test(text)) return 'french';
    return 'english';
};
