import { api } from './api.js';

// Lightweight version probe used by the customer MenuPage. Polled every
// ~30 s while the page is visible. The endpoint returns a single ISO
// timestamp and is cheap (one max() across three small tables).
export async function getVersion() {
  const { data } = await api.get('/menu/version');
  return data && data.version ? data.version : null;
}

export const menuService = { getVersion };
export default menuService;
