/**
 * ========================================
 * ÇOKLU DİL (i18n) HELPER FONKSİYONLARI
 * ========================================
 */

/**
 * Request'ten dil bilgisini algılar
 * Öncelik sırası: query param > user preference > Accept-Language header > default
 * @param {Object} req - Express request object
 * @returns {String} Dil kodu (tr, en)
 */
function detectLanguage(req) {
  // 1. Query parameter
  if (req.query && req.query.lang) {
    const lang = req.query.lang.toLowerCase();
    if (['tr', 'en'].includes(lang)) {
      return lang;
    }
  }
  
  // 2. User preference (eğer authenticated ise)
  if (req.user && req.user.preferredLanguage) {
    const userLang = req.user.preferredLanguage.toLowerCase();
    if (['tr', 'en'].includes(userLang)) {
      return userLang;
    }
  }
  
  // 3. Accept-Language header
  if (req.headers && req.headers['accept-language']) {
    const acceptLang = req.headers['accept-language'];
    // Basit parsing: "tr-TR,tr;q=0.9,en-US;q=0.8" -> "tr"
    const langMatch = acceptLang.match(/(tr|en)/i);
    if (langMatch) {
      return langMatch[1].toLowerCase();
    }
  }
  
  // 4. Default
  return 'tr';
}

/**
 * Çoklu dil verisini istenen dile göre transform eder (Campaign için)
 * @param {Object} campaign - Campaign document
 * @param {String} lang - İstenen dil (tr, en)
 * @param {String} fallbackLang - Fallback dil (default: 'tr')
 * @returns {Object} Transform edilmiş campaign
 */
function transformCampaignByLanguage(campaign, lang = 'tr', fallbackLang = 'tr') {
  if (!campaign) return null;
  
  const campaignObj = campaign.toObject ? campaign.toObject() : campaign;
  
  return {
    ...campaignObj,
    title: campaignObj.title?.[lang] || campaignObj.title?.[fallbackLang] || '',
    description: campaignObj.description?.[lang] || campaignObj.description?.[fallbackLang] || '',
    content: (campaignObj.content || []).map(item => ({
      itemTitle: item.itemTitle?.[lang] || item.itemTitle?.[fallbackLang] || '',
      itemDescription: item.itemDescription?.[lang] || item.itemDescription?.[fallbackLang] || '',
      itemImage: item.itemImage || '',
      itemVideo: item.itemVideo || '',
      itemIndex: item.itemIndex || 1
    })),
    segments: (campaignObj.segments || []).map(segment => ({
      ...segment,
      description: segment.description?.[lang] || segment.description?.[fallbackLang] || segment.description || ''
    })),
    language: lang
  };
}

/**
 * Çoklu dil verisini istenen dile göre transform eder (Question için)
 * @param {Object} question - Question document
 * @param {String} lang - İstenen dil (tr, en)
 * @param {String} fallbackLang - Fallback dil (default: 'tr')
 * @returns {Object} Transform edilmiş question
 */
function transformQuestionByLanguage(question, lang = 'tr', fallbackLang = 'tr') {
  if (!question) return null;
  
  const questionObj = question.toObject ? question.toObject() : question;
  
  return {
    ...questionObj,
    questionText: questionObj.questionText?.[lang] || questionObj.questionText?.[fallbackLang] || '',
    options: (questionObj.options || []).map(option => ({
      text: option.text?.[lang] || option.text?.[fallbackLang] || '',
      isTrue: option.isTrue || false
    })),
    language: lang
  };
}

module.exports = {
  detectLanguage,
  transformCampaignByLanguage,
  transformQuestionByLanguage
};

