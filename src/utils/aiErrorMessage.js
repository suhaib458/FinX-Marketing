const messages = {
  ar: {
    AI_NOT_CONFIGURED: 'خدمة الذكاء الاصطناعي غير مهيأة بعد.',
    AI_AUTH_ERROR: 'تعذر توثيق اتصال الذكاء الاصطناعي. تحقق من مفتاح Gemini.',
    AI_MODEL_NOT_FOUND: 'نموذج الذكاء الاصطناعي المحدد غير متاح حاليًا.',
    AI_RATE_LIMITED: 'خدمة الذكاء الاصطناعي مشغولة حاليًا. جرّب بعد قليل.',
    AI_TIMEOUT: 'استغرق إنشاء المحتوى وقتًا أطول من المتوقع. حاول مرة أخرى.',
    REQUEST_TIMEOUT: 'انتهت مهلة الطلب. حاول مرة أخرى.',
    AI_CONTENT_BLOCKED: 'تعذر إنشاء هذا المحتوى بسبب قيود الأمان.',
    AI_INVALID_RESPONSE: 'وصلت استجابة غير مكتملة من الذكاء الاصطناعي. حاول مرة أخرى.',
    AI_EMPTY_RESPONSE: 'لم يُرجع الذكاء الاصطناعي محتوى. حاول مرة أخرى.',
    AI_PROVIDER_ERROR: 'تعذر الاتصال بخدمة الذكاء الاصطناعي حاليًا.',
    AI_REQUEST_REJECTED: 'رفضت خدمة الذكاء الاصطناعي الطلب. جرّب صياغة مختلفة.',
    INSUFFICIENT_CREDITS: 'رصيدك غير كافٍ لإتمام عملية التوليد.',
    GENERATION_IN_PROGRESS: 'عملية التوليد نفسها ما زالت قيد التنفيذ.',
  },
  en: {
    AI_NOT_CONFIGURED: 'AI generation is not configured yet.',
    AI_AUTH_ERROR: 'AI authentication failed. Check the Gemini API key.',
    AI_MODEL_NOT_FOUND: 'The configured AI model is currently unavailable.',
    AI_RATE_LIMITED: 'The AI service is busy right now. Please try again shortly.',
    AI_TIMEOUT: 'AI generation took too long. Please try again.',
    REQUEST_TIMEOUT: 'The request timed out. Please try again.',
    AI_CONTENT_BLOCKED: 'This content could not be generated because of safety restrictions.',
    AI_INVALID_RESPONSE: 'The AI returned an incomplete response. Please try again.',
    AI_EMPTY_RESPONSE: 'The AI returned no content. Please try again.',
    AI_PROVIDER_ERROR: 'The AI service could not be reached right now.',
    AI_REQUEST_REJECTED: 'The AI service rejected the request. Try different wording.',
    INSUFFICIENT_CREDITS: 'You do not have enough credits for this generation.',
    GENERATION_IN_PROGRESS: 'This generation is still in progress.',
  },
};

export function aiErrorMessage(error, language = 'ar', fallback = '') {
  const locale = language === 'en' ? 'en' : 'ar';
  return messages[locale][error?.code]
    || (typeof error?.message === 'string' && error.message !== 'Request failed' ? error.message : '')
    || fallback
    || messages[locale].AI_PROVIDER_ERROR;
}

export default aiErrorMessage;
