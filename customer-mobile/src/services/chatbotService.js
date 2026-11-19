import { apiRequest } from './api';

export const getChatbotCategories = () =>
  apiRequest('/chatbot/categories');

export const getChatbotFAQs = (categoryId = null) => {
  const query = categoryId
    ? `?category_id=${encodeURIComponent(categoryId)}`
    : '';

  return apiRequest(`/chatbot/faqs${query}`);
};

export const getChatbotFAQ = (faqId) =>
  apiRequest(`/chatbot/faqs/${encodeURIComponent(faqId)}`);

export const searchChatbotFAQs = (query) =>
  apiRequest(`/chatbot/search?q=${encodeURIComponent(query)}`);